/**
 * Modèle MongoDB pour les styles de transformation
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IStyleDocument extends Document {
  styleId: string;
  name: string;
  nameFr: string;
  nameEn: string;
  category: 'professional' | 'artistic' | 'tech' | 'creative' | 'thematic';
  description: string;
  descriptionFr: string;
  descriptionEn: string;
  longDescription?: string;
  longDescriptionFr?: string;
  longDescriptionEn?: string;
  tags: string[];
  images: {
    previewUrl: string;
    thumbnailUrl: string;
    mediumUrl: string;
    largeUrl: string;
    exampleTransformations: {
      beforeUrl: string;
      afterUrl: string;
      caption?: string;
    }[];
  };
  technical: {
    modelVersion: string;
    processingComplexity: 'low' | 'medium' | 'high';
    supportedResolutions: string[];
    estimatedProcessingTime: number;
    requiredMemory: number;
    gpuRequired: boolean;
  };
  pricing: {
    isPremium: boolean;
    credits?: number;
    tier: 'free' | 'premium' | 'enterprise';
  };
  metrics: {
    popularity: number;
    usageCount: number;
    averageRating: number;
    ratingCount: number;
    successRate: number;
  };
  availability: {
    isActive: boolean;
    regions: string[];
    maintenanceMode: boolean;
    deprecatedAt?: Date;
  };
  geminiConfig: {
    prompt: string;
    model: string;
    parameters: {
      temperature: number;
      topP: number;
      topK: number;
      maxOutputTokens: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const StyleSchema = new Schema<IStyleDocument>(
  {
    styleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    nameFr: {
      type: String,
      required: true,
    },
    nameEn: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['professional', 'artistic', 'tech', 'creative', 'thematic'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    descriptionFr: {
      type: String,
      required: true,
    },
    descriptionEn: {
      type: String,
      required: true,
    },
    longDescription: String,
    longDescriptionFr: String,
    longDescriptionEn: String,
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    images: {
      previewUrl: { type: String, required: true },
      thumbnailUrl: { type: String, required: true },
      mediumUrl: { type: String, required: true },
      largeUrl: { type: String, required: true },
      exampleTransformations: [
        {
          beforeUrl: String,
          afterUrl: String,
          caption: String,
        },
      ],
    },
    technical: {
      modelVersion: { type: String, required: true },
      processingComplexity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
      },
      supportedResolutions: [String],
      estimatedProcessingTime: { type: Number, required: true },
      requiredMemory: { type: Number, required: true },
      gpuRequired: { type: Boolean, default: false },
    },
    pricing: {
      isPremium: { type: Boolean, default: false },
      credits: Number,
      tier: {
        type: String,
        enum: ['free', 'premium', 'enterprise'],
        default: 'free',
      },
    },
    metrics: {
      popularity: { type: Number, default: 0, min: 0, max: 1 },
      usageCount: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      ratingCount: { type: Number, default: 0 },
      successRate: { type: Number, default: 1, min: 0, max: 1 },
    },
    availability: {
      isActive: { type: Boolean, default: true, index: true },
      regions: { type: [String], default: ['all'] },
      maintenanceMode: { type: Boolean, default: false },
      deprecatedAt: Date,
    },
    geminiConfig: {
      prompt: { type: String, required: true },
      model: { type: String, required: true },
      parameters: {
        temperature: { type: Number, default: 0.7 },
        topP: { type: Number, default: 0.8 },
        topK: { type: Number, default: 40 },
        maxOutputTokens: { type: Number, default: 1024 },
      },
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'styles',
  }
);

// Index composés pour les requêtes fréquentes
StyleSchema.index({ category: 1, 'availability.isActive': 1 });
StyleSchema.index({ 'metrics.popularity': -1, 'availability.isActive': 1 });
StyleSchema.index({ 'pricing.tier': 1, category: 1 });
StyleSchema.index({ tags: 1, 'availability.isActive': 1 });

// Méthodes d'instance
StyleSchema.methods.incrementUsage = async function (): Promise<void> {
  this.metrics.usageCount += 1;
  await this.save();
};

StyleSchema.methods.updatePopularity = async function (): Promise<void> {
  // Calculer la popularité basée sur l'usage et les ratings
  const usageScore = Math.min(this.metrics.usageCount / 1000, 1);
  const ratingScore = this.metrics.averageRating / 5;
  this.metrics.popularity = (usageScore * 0.7 + ratingScore * 0.3);
  await this.save();
};

export const StyleModel = mongoose.model<IStyleDocument>('Style', StyleSchema);
