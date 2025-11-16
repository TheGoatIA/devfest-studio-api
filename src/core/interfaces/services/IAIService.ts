/**
 * Interface pour le service d'intelligence artificielle
 */

import { IStyleDocument } from '../../../infrastructure/database/mongodb/models/StyleModel';

export interface TransformImageInput {
  imageBuffer: Buffer;
  imageUrl?: string;
  style: IStyleDocument | CustomStyleConfig;
  quality: 'standard' | 'high' | 'ultra';
  options?: TransformationOptions;
}

export interface CustomStyleConfig {
  description: string;
  language: 'fr' | 'en';
  complexity?: 'low' | 'medium' | 'high';
}

export interface TransformationOptions {
  preserveMetadata?: boolean;
  enhanceQuality?: boolean;
  outputFormat?: 'jpg' | 'png' | 'webp';
  maxResolution?: { width: number; height: number };
}

export interface TransformResult {
  transformedImageBuffer: Buffer;
  analysis: ImageAnalysis;
  processingMetrics: ProcessingMetrics;
}

export interface ImageAnalysis {
  explanation: string;
  explanationFr: string;
  explanationEn: string;
  confidence: number;
  detectedElements: string[];
  composition: {
    mainSubject: string;
    backgroundType: string;
    lightingConditions: string;
    colorPalette: string[];
  };
  technical: {
    qualityScore: number;
    complexityScore: number;
    enhancementAreas: string[];
  };
}

export interface ProcessingMetrics {
  totalProcessingTime: number;
  modelVersion: string;
  resourcesUsed: {
    cpu?: number;
    memory?: number;
    gpu?: number;
  };
}

export interface StyleValidation {
  isValid: boolean;
  validationScore: number;
  suggestions: string[];
  estimatedProcessingTime: number;
  warnings: string[];
}

export interface IAIService {
  /**
   * Transforme une image en appliquant un style
   */
  transformImage(input: TransformImageInput): Promise<TransformResult>;

  /**
   * Analyse une image
   */
  analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysis>;

  /**
   * Valide un style personnalisé
   */
  validateCustomStyle(description: string, language: string): Promise<StyleValidation>;

  /**
   * Génère un aperçu de style
   */
  generateStylePreview?(styleId: string, sampleImageBuffer: Buffer): Promise<Buffer>;
}
