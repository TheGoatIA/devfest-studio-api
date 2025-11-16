/**
 * Modèle MongoDB pour les transformations
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ITransformationDocument extends Document {
  transformationId: string;
  userId: string;
  photoId: string;
  styleId?: string;
  customStyle?: {
    description: string;
    language: 'fr' | 'en';
    generatedPrompt: string;
    validationScore: number;
  };
  request: {
    quality: 'standard' | 'high' | 'ultra';
    options: {
      enableNotifications: boolean;
      autoSave: boolean;
      publicSharing: boolean;
      preserveMetadata: boolean;
    };
    priority: 'normal' | 'high';
  };
  processing: {
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    currentStep: 'uploading' | 'analyzing' | 'transforming' | 'finalizing';
    queuePosition?: number;
    estimatedTimeRemaining?: number;
    processingNode?: string;
    startedAt?: Date;
    completedAt?: Date;
  };
  result?: {
    transformedImageUrl: string;
    transformedImages: {
      thumbnail: string;
      medium: string;
      large: string;
      original: string;
    };
    aiAnalysis: {
      explanation: string;
      explanationFr: string;
      explanationEn: string;
      confidence: number;
      detectedElements: string[];
    };
    metadata: {
      originalResolution: { width: number; height: number };
      outputResolution: { width: number; height: number };
      fileSize: number;
      format: string;
    };
  };
  metrics: {
    totalProcessingTime?: number;
    queueTime?: number;
    actualProcessingTime?: number;
    retryCount: number;
  };
  social: {
    isFavorite: boolean;
    isPublic: boolean;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    downloadCount: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
    retryable: boolean;
    occurredAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const TransformationSchema = new Schema<ITransformationDocument>(
  {
    transformationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    photoId: {
      type: String,
      required: true,
      index: true,
    },
    styleId: {
      type: String,
      index: true,
    },
    customStyle: {
      description: String,
      language: {
        type: String,
        enum: ['fr', 'en'],
      },
      generatedPrompt: String,
      validationScore: Number,
    },
    request: {
      quality: {
        type: String,
        enum: ['standard', 'high', 'ultra'],
        required: true,
      },
      options: {
        enableNotifications: { type: Boolean, default: true },
        autoSave: { type: Boolean, default: true },
        publicSharing: { type: Boolean, default: false },
        preserveMetadata: { type: Boolean, default: true },
      },
      priority: {
        type: String,
        enum: ['normal', 'high'],
        default: 'normal',
      },
    },
    processing: {
      status: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'queued',
        index: true,
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
      currentStep: {
        type: String,
        enum: ['uploading', 'analyzing', 'transforming', 'finalizing'],
        default: 'uploading',
      },
      queuePosition: Number,
      estimatedTimeRemaining: Number,
      processingNode: String,
      startedAt: Date,
      completedAt: Date,
    },
    result: {
      transformedImageUrl: String,
      transformedImages: {
        thumbnail: String,
        medium: String,
        large: String,
        original: String,
      },
      aiAnalysis: {
        explanation: String,
        explanationFr: String,
        explanationEn: String,
        confidence: Number,
        detectedElements: [String],
      },
      metadata: {
        originalResolution: {
          width: Number,
          height: Number,
        },
        outputResolution: {
          width: Number,
          height: Number,
        },
        fileSize: Number,
        format: String,
      },
    },
    metrics: {
      totalProcessingTime: Number,
      queueTime: Number,
      actualProcessingTime: Number,
      retryCount: { type: Number, default: 0 },
    },
    social: {
      isFavorite: { type: Boolean, default: false },
      isPublic: { type: Boolean, default: false },
      viewCount: { type: Number, default: 0 },
      likeCount: { type: Number, default: 0 },
      shareCount: { type: Number, default: 0 },
      downloadCount: { type: Number, default: 0 },
    },
    error: {
      code: String,
      message: String,
      details: Schema.Types.Mixed,
      retryable: Boolean,
      occurredAt: Date,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
    collection: 'transformations',
  }
);

// Index composés
TransformationSchema.index({ userId: 1, createdAt: -1 });
TransformationSchema.index({ 'processing.status': 1, createdAt: -1 });
TransformationSchema.index({ userId: 1, 'processing.status': 1 });
TransformationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TransformationModel = mongoose.model<ITransformationDocument>(
  'Transformation',
  TransformationSchema
);
