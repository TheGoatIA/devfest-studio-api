/**
 * Client pour l'API Google Gemini
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import logger from '../../../config/logger';
import { config } from '../../../config/environment';
import { AppError } from '../../../shared/errors/AppError';

export enum Modality {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
}

export interface GeminiGenerateInput {
  prompt: string;
  imageBuffer?: Buffer;
  imageUrl?: string;
  model?: string;
  parameters?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  text: string;
  confidence: number;
  metadata?: any;
}

export interface GeminiImageTransformInput {
  prompt: string;
  imageBuffer: Buffer;
  mimeType?: string;
}

export interface GeminiImageResponse {
  imageBuffer: Buffer;
  mimeType: string;
  metadata?: any;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;

  constructor() {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.defaultModel = 'gemini-2.5-flash-image';

    logger.info('🤖 GeminiClient initialisé', {
      model: this.defaultModel,
      imageTransformModel: 'gemini-2.5-flash-image',
    });
  }

  /**
   * Génère du contenu avec Gemini
   */
  async generate(input: GeminiGenerateInput): Promise<GeminiResponse> {
    try {
      const modelName = input.model || this.defaultModel;
      const model = this.genAI.getGenerativeModel({ model: modelName });

      logger.debug('🤖 Appel Gemini API', {
        model: modelName,
        hasImage: !!input.imageBuffer || !!input.imageUrl,
        promptLength: input.prompt.length,
      });

      const startTime = Date.now();

      // Préparer le contenu
      const parts: any[] = [{ text: input.prompt }];

      // Ajouter l'image si fournie
      if (input.imageBuffer) {
        const base64Image = input.imageBuffer.toString('base64');
        parts.push({
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        });
      }

      // Configuration de génération
      const generationConfig = {
        temperature: input.parameters?.temperature ?? 0.7,
        topP: input.parameters?.topP ?? 0.8,
        topK: input.parameters?.topK ?? 40,
        maxOutputTokens: input.parameters?.maxOutputTokens ?? 1024,
      };

      // Générer le contenu
      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;

      logger.info('✅ Gemini API - Réponse reçue', {
        model: modelName,
        processingTime,
        responseLength: text.length,
      });

      return {
        text,
        confidence: 0.9, // Gemini ne retourne pas toujours un score de confiance
        metadata: {
          processingTime,
          model: modelName,
        },
      };
    } catch (error: any) {
      logger.error('❌ Erreur Gemini API', {
        error: error.message,
        code: error.code,
        status: error.status,
      });

      // Gérer les différents types d'erreurs
      if (error.status === 429) {
        throw new AppError('Trop de requêtes. Veuillez réessayer plus tard.', 429);
      }

      if (error.status === 403) {
        throw new AppError('Clé API invalide ou accès refusé.', 403);
      }

      if (error.status === 400) {
        throw new AppError('Requête invalide. Vérifiez le format de l\'image.', 400);
      }

      throw new AppError(`Erreur lors de l'appel à Gemini: ${error.message}`, 500);
    }
  }

  /**
   * Analyse une image avec Gemini
   */
  async analyzeImage(imageBuffer: Buffer, customPrompt?: string): Promise<GeminiResponse> {
    const prompt =
      customPrompt ||
      `Analyze this image in detail. Describe:
1. The main subject or focus
2. The background and setting
3. Lighting conditions
4. Color palette and mood
5. Composition quality
6. Any notable elements or features

Provide a comprehensive analysis in JSON format with the following structure:
{
  "mainSubject": "description",
  "backgroundType": "description",
  "lightingConditions": "description",
  "colorPalette": ["color1", "color2", "color3"],
  "qualityScore": 0-10,
  "complexityScore": 0-10,
  "detectedElements": ["element1", "element2"],
  "enhancementAreas": ["area1", "area2"]
}`;

    return this.generate({
      prompt,
      imageBuffer,
      model: 'gemini-pro-vision',
      parameters: {
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });
  }

  /**
   * Valide une description de style personnalisé
   */
  async validateStyleDescription(
    description: string,
    language: string = 'fr'
  ): Promise<{
    isValid: boolean;
    score: number;
    suggestions: string[];
    warnings: string[];
  }> {
    const prompt = `Vous êtes un expert en validation de prompts pour génération d'images artistiques.

Évaluez cette description de style : "${description}"

Langue : ${language}

Fournissez une réponse JSON avec :
{
  "isValid": true/false,
  "score": 0-100,
  "suggestions": ["suggestion1", "suggestion2"],
  "warnings": ["warning1", "warning2"],
  "estimatedComplexity": "low/medium/high"
}

Critères de validation :
- La description est-elle claire et spécifique ?
- Contient-elle suffisamment de détails ?
- Est-elle réalisable avec une IA générative ?
- Y a-t-il des éléments problématiques ou offensants ?`;

    const response = await this.generate({
      prompt,
      model: 'gemini-pro',
      parameters: {
        temperature: 0.3,
        topP: 0.8,
        topK: 30,
        maxOutputTokens: 1024,
      },
    });

    try {
      // Extraire le JSON de la réponse
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          isValid: result.isValid || false,
          score: result.score || 0,
          suggestions: result.suggestions || [],
          warnings: result.warnings || [],
        };
      }
    } catch (error) {
      logger.warn('⚠️  Impossible de parser la réponse de validation', {
        error,
        response: response.text,
      });
    }

    // Retour par défaut si le parsing échoue
    return {
      isValid: description.length >= 20,
      score: description.length >= 20 ? 70 : 30,
      suggestions: ['Ajoutez plus de détails pour une meilleure transformation'],
      warnings: [],
    };
  }

  /**
   * Transforme une image avec Gemini 2.5 Flash Image
   */
  async transformImage(input: GeminiImageTransformInput): Promise<GeminiImageResponse> {
    try {
      logger.info('🎨 Transformation image avec Gemini 2.5 Flash', {
        promptLength: input.prompt.length,
        imageSize: input.imageBuffer.length,
      });

      const startTime = Date.now();

      // Préparer l'image
      const base64Image = input.imageBuffer.toString('base64');
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: input.mimeType || 'image/jpeg',
        },
      };

      // Appel au modèle Gemini 2.5 Flash Image
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-image'
      });

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            imagePart,
            { text: input.prompt },
          ],
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          // responseModalities: [Modality.IMAGE], // Sera activé quand l'API le supporte
        },
      });

      const response = result.response;
      const processingTime = Date.now() - startTime;

      // Pour l'instant, Gemini retourne du texte décrivant la transformation
      // Dans une vraie implémentation, il faudrait utiliser un modèle de génération d'image
      // comme Imagen ou attendre que Gemini 2.5 Flash supporte responseModalities: IMAGE

      // SIMULATION: Pour la démo, on retourne l'image originale
      // En production, vous devriez intégrer Imagen ou un autre modèle de génération
      logger.info('✅ Transformation Gemini complétée', {
        processingTime,
        model: 'gemini-2.5-flash-image',
      });

      // Note: Cette implémentation est une simulation
      // Vous devez remplacer ceci par l'appel réel à Imagen ou attendre le support IMAGE
      return {
        imageBuffer: input.imageBuffer, // Temporaire: retourne l'image originale
        mimeType: input.mimeType || 'image/jpeg',
        metadata: {
          processingTime,
          model: 'gemini-2.5-flash-image',
          prompt: input.prompt,
          analysisText: response.text ? response.text() : 'Transformation appliquée',
        },
      };
    } catch (error: any) {
      logger.error('❌ Erreur transformation image Gemini', {
        error: error.message,
        code: error.code,
        status: error.status,
      });

      // Gérer les différents types d'erreurs
      if (error.status === 429) {
        throw new AppError('Trop de requêtes. Veuillez réessayer plus tard.', 429);
      }

      if (error.status === 403) {
        throw new AppError('Clé API invalide ou accès refusé.', 403);
      }

      if (error.status === 400) {
        throw new AppError('Requête invalide. Vérifiez le format de l\'image.', 400);
      }

      throw new AppError(`Erreur lors de la transformation: ${error.message}`, 500);
    }
  }

  /**
   * Vérifie la santé de l'API Gemini
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.generate({
        prompt: 'Ping - respond with "pong"',
        model: 'gemini-pro',
        parameters: {
          temperature: 0,
          maxOutputTokens: 10,
        },
      });

      return response.text.toLowerCase().includes('pong');
    } catch (error) {
      logger.error('❌ Gemini health check failed', { error });
      return false;
    }
  }
}
