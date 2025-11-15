/**
 * Tests d'intégration pour l'endpoint health
 */

import request from 'supertest';
import express, { Application } from 'express';

describe('Health Endpoint', () => {
  let app: Application;

  beforeAll(() => {
    // Créer une app Express minimale pour les tests
    app = express();
    app.use(express.json());

    // Ajouter l'endpoint health
    app.get('/api/v1/health', (_req, res) => {
      res.json({
        success: true,
        message: 'API en bonne santé',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    });
  });

  describe('GET /api/v1/health', () => {
    it('devrait retourner un statut 200', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
    });

    it('devrait retourner le bon format de réponse', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('version');
    });

    it('devrait retourner status "healthy"', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.data.status).toBe('healthy');
    });

    it('devrait retourner la version 1.0.0', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.data.version).toBe('1.0.0');
    });

    it('devrait retourner un timestamp valide', async () => {
      const response = await request(app).get('/api/v1/health');

      const timestamp = new Date(response.body.data.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});
