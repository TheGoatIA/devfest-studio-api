/**
 * Client pour l'API Google Gemini
 */

import { GoogleGenAI, Modality } from '@google/genai';
import logger from '../../../config/logger';
import { config } from '../../../config/environment';
import { AppError } from '../../../shared/errors/AppError';

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
  private genAI: GoogleGenAI;
  private defaultModel: string;

  constructor() {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
    this.defaultModel = 'gemini-2.5-flash-image';

    logger.info('🤖 GeminiClient initialisé', {
      model: this.defaultModel,
      imageTransformModel: 'gemini-2.5-flash-image',
    });
  }

  /**
   * Convertit un buffer en partie générative
   */
  private fileToGenerativePart(base64: string, mimeType: string) {
    return {
      inlineData: {
        data: base64,
        mimeType,
      },
    };
  }

  /**
   * Génère du contenu avec Gemini (text-based)
   */
  async generate(input: GeminiGenerateInput): Promise<GeminiResponse> {
    try {
      const modelName = input.model || 'gemini-2.5-flash-image';

      logger.debug('🤖 Appel Gemini API (text generation)', {
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
        parts.push(this.fileToGenerativePart(base64Image, 'image/jpeg'));
      }

      // Configuration de génération
      const generationConfig = {
        temperature: input.parameters?.temperature ?? 0.7,
        topP: input.parameters?.topP ?? 0.8,
        topK: input.parameters?.topK ?? 40,
        maxOutputTokens: input.parameters?.maxOutputTokens ?? 1024,
      };

      // Générer le contenu avec la nouvelle API
      const response = await this.genAI.models.generateContent({
        model: modelName,
        contents: {
          parts: parts,
        },
        config: generationConfig,
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const processingTime = Date.now() - startTime;

      logger.info('✅ Gemini API - Réponse reçue', {
        model: modelName,
        processingTime,
        responseLength: text.length,
      });

      return {
        text,
        confidence: 0.9,
        metadata: {
          processingTime,
          model: modelName,
        },
      };
    } catch (error: any) {
      logger.error('❌ Erreur Gemini API', {
        error: error.message,
      });

      // Gérer les différents types d'erreurs
      if (error.message?.includes('API key not valid')) {
        throw new AppError('Clé API invalide ou accès refusé.', 403);
      }

      if (error.message?.includes('quota')) {
        throw new AppError('Trop de requêtes. Veuillez réessayer plus tard.', 429);
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
      model: 'gemini-2.5-flash-image',
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
      model: 'gemini-2.5-flash-image',
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
   * Transforme une image avec Gemini 2.5 Flash Image (vraie transformation)
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
      const imagePart = this.fileToGenerativePart(base64Image, input.mimeType || 'image/jpeg');

      // Appel au modèle Gemini 2.5 Flash Image avec responseModalities
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [imagePart, { text: input.prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const processingTime = Date.now() - startTime;

      // Vérifier que la réponse contient des candidats
      if (!response.candidates || response.candidates.length === 0) {
        throw new AppError('No candidates found in API response', 500);
      }

      const firstCandidate = response.candidates[0];
      if (!firstCandidate || !firstCandidate.content || !firstCandidate.content.parts) {
        throw new AppError('Invalid response structure from API', 500);
      }

      // Extraire l'image transformée de la réponse
      for (const part of firstCandidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          logger.info('✅ Transformation Gemini complétée avec succès', {
            processingTime,
            model: 'gemini-2.5-flash-image',
            transformedImageSize: part.inlineData.data.length,
          });

          // Convertir base64 en Buffer
          const imageBuffer = Buffer.from(part.inlineData.data, 'base64');

          return {
            imageBuffer: imageBuffer,
            mimeType: part.inlineData.mimeType || input.mimeType || 'image/jpeg',
            metadata: {
              processingTime,
              model: 'gemini-2.5-flash-image',
              prompt: input.prompt,
              originalSize: input.imageBuffer.length,
              transformedSize: imageBuffer.length,
            },
          };
        }
      }

      // Si aucune image n'est trouvée dans la réponse
      throw new AppError('No image data found in the API response.', 500);
    } catch (error: any) {
      logger.error('❌ Erreur transformation image Gemini', {
        error: error.message,
        stack: error.stack,
      });

      // Gérer les différents types d'erreurs
      if (error.message?.includes('API key not valid')) {
        throw new AppError(
          'The provided API key is not valid. Please check your environment variables.',
          403
        );
      }

      if (error.message?.includes('quota')) {
        throw new AppError('Trop de requêtes. Veuillez réessayer plus tard.', 429);
      }

      if (error.message?.includes('No image data found')) {
        throw new AppError(error.message, 500);
      }

      throw new AppError(`Failed to transform image: ${error.message}`, 500);
    }
  }

  /**
   * Vérifie la santé de l'API Gemini
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.generate({
        prompt: 'Ping - respond with "pong"',
        model: 'gemini-2.5-flash-image',
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
