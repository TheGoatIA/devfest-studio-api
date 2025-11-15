/**
 * Service de Webhooks pour notifier les événements en temps réel
 *
 * Ce service gère l'envoi de notifications webhook pour les événements suivants:
 * - transformation.started
 * - transformation.completed
 * - transformation.failed
 * - photo.uploaded
 * - photo.deleted
 */

import axios, { AxiosError } from 'axios';
import logger from '../../config/logger';
import { EventEmitter } from 'events';

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: any;
  userId?: string;
}

export interface WebhookSubscriber {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
}

/**
 * Classe WebhookService
 */
export class WebhookService extends EventEmitter {
  private subscribers: Map<string, WebhookSubscriber>;
  private eventQueue: WebhookEvent[];
  private isProcessing: boolean;

  constructor() {
    super();
    this.subscribers = new Map();
    this.eventQueue = [];
    this.isProcessing = false;

    logger.info('🔔 WebhookService initialisé');
  }

  /**
   * Ajouter un subscriber webhook
   */
  addSubscriber(subscriber: WebhookSubscriber): void {
    this.subscribers.set(subscriber.id, subscriber);
    logger.info('✅ Subscriber webhook ajouté', {
      id: subscriber.id,
      url: subscriber.url,
      events: subscriber.events,
    });
  }

  /**
   * Supprimer un subscriber
   */
  removeSubscriber(id: string): void {
    this.subscribers.delete(id);
    logger.info('🗑️  Subscriber webhook supprimé', { id });
  }

  /**
   * Émettre un événement webhook
   */
  async emitWebhook(event: string, data: any, userId?: string): Promise<void> {
    const webhookEvent: WebhookEvent = {
      event,
      timestamp: new Date().toISOString(),
      data,
      userId,
    };

    logger.info('📣 Événement webhook émis', {
      event,
      userId,
      subscribersCount: this.subscribers.size,
    });

    // Émettre l'événement via EventEmitter pour les listeners locaux (interface web)
    this.emit(event, webhookEvent);
    this.emit('*', webhookEvent); // Événement universel

    // Ajouter à la queue pour envoi HTTP
    this.eventQueue.push(webhookEvent);

    // Démarrer le traitement si pas déjà en cours
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Traiter la queue d'événements
   */
  private async processQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    const event = this.eventQueue.shift();
    if (!event) {
      this.isProcessing = false;
      return;
    }

    // Envoyer aux subscribers concernés
    const promises: Promise<void>[] = [];

    for (const [, subscriber] of this.subscribers) {
      // Vérifier si le subscriber est actif
      if (!subscriber.active) {
        continue;
      }

      // Vérifier si le subscriber est intéressé par cet événement
      if (subscriber.events.includes(event.event) || subscriber.events.includes('*')) {
        promises.push(this.sendToSubscriber(subscriber, event));
      }
    }

    // Attendre que tous les envois soient terminés
    await Promise.allSettled(promises);

    // Continuer avec le prochain événement
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Envoyer un événement à un subscriber
   */
  private async sendToSubscriber(
    subscriber: WebhookSubscriber,
    event: WebhookEvent
  ): Promise<void> {
    try {
      logger.debug('📤 Envoi webhook', {
        subscriberId: subscriber.id,
        url: subscriber.url,
        event: event.event,
      });

      const payload = {
        ...event,
        subscriberId: subscriber.id,
      };

      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'DevFest-Studio-Webhook/1.0',
        'X-Webhook-Event': event.event,
        'X-Webhook-Timestamp': event.timestamp,
      };

      // Ajouter signature si secret fourni
      if (subscriber.secret) {
        const crypto = require('crypto');
        const signature = crypto
          .createHmac('sha256', subscriber.secret)
          .update(JSON.stringify(payload))
          .digest('hex');

        headers['X-Webhook-Signature'] = signature;
      }

      const response = await axios.post(subscriber.url, payload, {
        headers,
        timeout: 5000, // 5 secondes max
      });

      logger.info('✅ Webhook envoyé avec succès', {
        subscriberId: subscriber.id,
        event: event.event,
        status: response.status,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error('❌ Erreur envoi webhook', {
          subscriberId: subscriber.id,
          event: event.event,
          error: axiosError.message,
          status: axiosError.response?.status,
        });
      } else {
        logger.error('❌ Erreur envoi webhook', {
          subscriberId: subscriber.id,
          event: event.event,
          error,
        });
      }
    }
  }

  /**
   * Méthodes d'aide pour émettre des événements spécifiques
   */

  async photoUploaded(photoId: string, userId: string, photoUrl: string): Promise<void> {
    await this.emitWebhook(
      'photo.uploaded',
      {
        photoId,
        url: photoUrl,
        userId,
      },
      userId
    );
  }

  async photoDeleted(photoId: string, userId: string): Promise<void> {
    await this.emitWebhook(
      'photo.deleted',
      {
        photoId,
        userId,
      },
      userId
    );
  }

  async transformationStarted(
    transformationId: string,
    userId: string,
    photoId: string,
    styleId: string
  ): Promise<void> {
    await this.emitWebhook(
      'transformation.started',
      {
        transformationId,
        photoId,
        styleId,
        userId,
      },
      userId
    );
  }

  async transformationCompleted(
    transformationId: string,
    userId: string,
    photoId: string,
    styleId: string,
    resultUrl: string
  ): Promise<void> {
    await this.emitWebhook(
      'transformation.completed',
      {
        transformationId,
        photoId,
        styleId,
        resultUrl,
        userId,
      },
      userId
    );
  }

  async transformationFailed(
    transformationId: string,
    userId: string,
    error: string
  ): Promise<void> {
    await this.emitWebhook(
      'transformation.failed',
      {
        transformationId,
        error,
        userId,
      },
      userId
    );
  }

  /**
   * Obtenir les statistiques des webhooks
   */
  getStats() {
    return {
      subscribersCount: this.subscribers.size,
      queueLength: this.eventQueue.length,
      isProcessing: this.isProcessing,
      subscribers: Array.from(this.subscribers.values()).map((sub) => ({
        id: sub.id,
        url: sub.url,
        events: sub.events,
        active: sub.active,
      })),
    };
  }
}

// Instance unique du service (Singleton)
export const webhookService = new WebhookService();

// Export par défaut
export default webhookService;
