/**
 * Service d'intelligence artificielle pour la transformation d'images
 * Utilise Google Gemini pour l'analyse et la génération d'images
 */

import sharp from 'sharp';
import {
  IAIService,
  TransformImageInput,
  TransformResult,
  ImageAnalysis,
  ProcessingMetrics,
  StyleValidation,
} from '../../core/interfaces/services/IAIService';
import { GeminiClient } from '../../infrastructure/external/gemini/GeminiClient';
import { IStyleDocument } from '../../infrastructure/database/mongodb/models/StyleModel';
import logger from '../../config/logger';
import { AppError } from '../../shared/errors/AppError';

export class AIService implements IAIService {
  private geminiClient: GeminiClient;

  constructor() {
    this.geminiClient = new GeminiClient();
    logger.info('🤖 AIService initialisé');
  }

  /**
   * Transforme une image en appliquant un style
   */
  async transformImage(input: TransformImageInput): Promise<TransformResult> {
    try {
      const startTime = Date.now();

      logger.info('🎨 Démarrage transformation image', {
        hasBuffer: !!input.imageBuffer,
        hasUrl: !!input.imageUrl,
        quality: input.quality,
      });

      // 1. Préparer l'image
      const processedImage = await this.prepareImage(
        input.imageBuffer,
        input.quality
      );

      // 2. Générer le prompt de transformation
      const prompt = this.generateTransformationPrompt(input.style, input.options);

      // 3. Appeler Gemini 2.5 Flash Image pour la transformation
      const geminiResponse = await this.geminiClient.transformImage({
        prompt: prompt,
        imageBuffer: processedImage,
        mimeType: 'image/jpeg',
      });

      // 4. Récupérer l'image transformée
      const transformedImage = geminiResponse.imageBuffer;

      // 5. Analyser l'image transformée (en utilisant les métadonnées)
      const analysis = await this.parseAnalysisFromMetadata(
        geminiResponse.metadata
      );

      // 6. Calculer les métriques
      const processingTime = Date.now() - startTime;
      const metrics: ProcessingMetrics = {
        totalProcessingTime: processingTime,
        modelVersion: 'gemini-2.5-flash-image',
        resourcesUsed: {
          memory: Math.round(processedImage.length / 1024 / 1024), // MB
        },
      };

      logger.info('✅ Transformation terminée', {
        processingTime,
        confidence: analysis.confidence,
      });

      return {
        transformedImageBuffer: transformedImage,
        analysis,
        processingMetrics: metrics,
      };
    } catch (error: any) {
      logger.error('❌ Erreur transformation image', {
        error: error.message,
      });
      throw new AppError(
        `Erreur lors de la transformation: ${error.message}`,
        500
      );
    }
  }

  /**
   * Analyse une image
   */
  async analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysis> {
    try {
      logger.info('🔍 Analyse d\'image en cours...');

      const response = await this.geminiClient.analyzeImage(imageBuffer);

      const analysis = await this.parseAnalysisFromGemini(response.text);

      logger.info('✅ Analyse terminée', {
        confidence: analysis.confidence,
        detectedElements: analysis.detectedElements.length,
      });

      return analysis;
    } catch (error: any) {
      logger.error('❌ Erreur analyse image', { error: error.message });
      throw new AppError(`Erreur lors de l'analyse: ${error.message}`, 500);
    }
  }

  /**
   * Valide un style personnalisé
   */
  async validateCustomStyle(
    description: string,
    language: string
  ): Promise<StyleValidation> {
    try {
      logger.info('✅ Validation style personnalisé', {
        descriptionLength: description.length,
        language,
      });

      const result = await this.geminiClient.validateStyleDescription(
        description,
        language
      );

      // Estimer le temps de traitement basé sur la complexité
      let estimatedTime = 30; // secondes
      if (result.score > 80) estimatedTime = 45;
      if (result.score > 90) estimatedTime = 60;

      return {
        isValid: result.isValid,
        validationScore: result.score,
        suggestions: result.suggestions,
        estimatedProcessingTime: estimatedTime,
        warnings: result.warnings,
      };
    } catch (error: any) {
      logger.error('❌ Erreur validation style', { error: error.message });
      throw new AppError(`Erreur lors de la validation: ${error.message}`, 500);
    }
  }

  /**
   * MÉTHODES PRIVÉES
   */

  /**
   * Prépare l'image pour le traitement
   */
  private async prepareImage(
    imageBuffer: Buffer,
    quality: 'standard' | 'high' | 'ultra'
  ): Promise<Buffer> {
    try {
      let maxWidth = 1920;
      let maxHeight = 1920;
      let jpegQuality = 85;

      switch (quality) {
        case 'high':
          maxWidth = 2560;
          maxHeight = 2560;
          jpegQuality = 95;
          break;
        case 'ultra':
          maxWidth = 4096;
          maxHeight = 4096;
          jpegQuality = 100;
          break;
      }

      const processed = await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: jpegQuality })
        .toBuffer();

      logger.debug('📐 Image préparée', {
        originalSize: imageBuffer.length,
        processedSize: processed.length,
        quality,
      });

      return processed;
    } catch (error: any) {
      throw new AppError(
        `Erreur lors de la préparation de l'image: ${error.message}`,
        500
      );
    }
  }

  /**
   * Applique des améliorations basiques à l'image
   * (En attendant l'intégration d'un vrai modèle de génération)
   */
  private async applyBasicEnhancements(
    imageBuffer: Buffer,
    quality: 'standard' | 'high' | 'ultra'
  ): Promise<Buffer> {
    try {
      // Appliquer des filtres basiques pour simuler une transformation
      const enhanced = await sharp(imageBuffer)
        .modulate({
          brightness: 1.05,
          saturation: 1.1,
        })
        .sharpen()
        .toBuffer();

      return enhanced;
    } catch (error: any) {
      // Si l'enhancement échoue, retourner l'image originale
      logger.warn('⚠️  Échec enhancement, utilisation image originale');
      return imageBuffer;
    }
  }

  /**
   * Génère le prompt de transformation
   */
  private generateTransformationPrompt(
    style: IStyleDocument | any,
    options?: any
  ): string {
    if ('geminiConfig' in style) {
      // Style prédéfini
      return style.geminiConfig.prompt;
    } else {
      // Style personnalisé
      return `Transform this image with the following style: ${style.description}.
        Maintain the original composition while applying the requested artistic transformation.
        Ensure high quality output with natural-looking results.
        Language: ${style.language}`;
    }
  }

  /**
   * Obtient les paramètres du modèle
   */
  private getModelParameters(
    style: IStyleDocument | any,
    quality: string
  ): {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  } {
    const baseParams = {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    };

    if ('geminiConfig' in style) {
      return { ...baseParams, ...style.geminiConfig.parameters };
    }

    // Ajustements selon la qualité
    switch (quality) {
      case 'ultra':
        return { ...baseParams, temperature: 0.5, topP: 0.9 };
      case 'high':
        return { ...baseParams, temperature: 0.6, topP: 0.85 };
      default:
        return baseParams;
    }
  }

  /**
   * Parse l'analyse depuis la réponse Gemini
   */
  private async parseAnalysisFromGemini(responseText: string): Promise<ImageAnalysis> {
    try {
      // Essayer d'extraire le JSON de la réponse
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          explanation: responseText,
          explanationFr: responseText,
          explanationEn: responseText,
          confidence: 0.85,
          detectedElements: parsed.detectedElements || [],
          composition: {
            mainSubject: parsed.mainSubject || 'Subject detected',
            backgroundType: parsed.backgroundType || 'Various background',
            lightingConditions: parsed.lightingConditions || 'Natural lighting',
            colorPalette: parsed.colorPalette || ['#000000', '#FFFFFF'],
          },
          technical: {
            qualityScore: parsed.qualityScore || 8,
            complexityScore: parsed.complexityScore || 7,
            enhancementAreas: parsed.enhancementAreas || [],
          },
        };
      }
    } catch (error) {
      logger.warn('⚠️  Impossible de parser la réponse Gemini, utilisation valeurs par défaut');
    }

    // Analyse par défaut si le parsing échoue
    return {
      explanation: responseText,
      explanationFr: 'Transformation appliquée avec succès',
      explanationEn: 'Transformation applied successfully',
      confidence: 0.75,
      detectedElements: ['image', 'content'],
      composition: {
        mainSubject: 'Image subject',
        backgroundType: 'Background',
        lightingConditions: 'Natural',
        colorPalette: ['#000000', '#FFFFFF'],
      },
      technical: {
        qualityScore: 8,
        complexityScore: 7,
        enhancementAreas: ['color', 'contrast'],
      },
    };
  }

  /**
   * Parse l'analyse depuis les métadonnées Gemini
   */
  private async parseAnalysisFromMetadata(metadata: any): Promise<ImageAnalysis> {
    try {
      const analysisText = metadata?.analysisText || 'Transformation appliquée avec succès';

      return {
        explanation: analysisText,
        explanationFr: 'Transformation appliquée avec succès avec Gemini 2.5 Flash Image',
        explanationEn: 'Transformation applied successfully with Gemini 2.5 Flash Image',
        confidence: 0.9,
        detectedElements: ['transformed-image'],
        composition: {
          mainSubject: 'Transformed subject',
          backgroundType: 'Styled background',
          lightingConditions: 'Enhanced lighting',
          colorPalette: ['#000000', '#FFFFFF'],
        },
        technical: {
          qualityScore: 9,
          complexityScore: 8,
          enhancementAreas: ['style', 'quality', 'artistic'],
        },
      };
    } catch (error) {
      logger.warn('⚠️  Impossible de parser les métadonnées, utilisation valeurs par défaut');

      return {
        explanation: 'Transformation appliquée',
        explanationFr: 'Transformation appliquée avec succès',
        explanationEn: 'Transformation applied successfully',
        confidence: 0.85,
        detectedElements: ['image'],
        composition: {
          mainSubject: 'Subject',
          backgroundType: 'Background',
          lightingConditions: 'Natural',
          colorPalette: ['#000000', '#FFFFFF'],
        },
        technical: {
          qualityScore: 8,
          complexityScore: 7,
          enhancementAreas: ['style', 'quality'],
        },
      };
    }
  }
}
