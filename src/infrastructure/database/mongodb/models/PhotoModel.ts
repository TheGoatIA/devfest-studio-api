/**
 * Modèle MongoDB pour les photos
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPhotoDocument extends Document {
  photoId: string;
  userId: string;
  originalFilename: string;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
    format: string;
    quality?: number;
    colorSpace?: string;
    orientation?: number;
    cameraInfo?: {
      make?: string;
      model?: string;
      focalLength?: string;
      aperture?: string;
      iso?: number;
      exposureTime?: string;
    };
    gpsInfo?: {
      latitude?: number;
      longitude?: number;
      altitude?: number;
    };
  };
  storage: {
    originalUrl: string;
    thumbnailUrl: string;
    mediumUrl?: string;
    cloudPath: string;
    bucket: string;
  };
  processing: {
    status: 'uploaded' | 'processing' | 'ready' | 'failed';
    thumbnailGenerated: boolean;
    compressionApplied: boolean;
    virusScanStatus?: 'pending' | 'clean' | 'infected';
  };
  uploadInfo: {
    uploadedAt: Date;
    processedAt?: Date;
    clientIp?: string;
    userAgent?: string;
  };
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PhotoSchema = new Schema<IPhotoDocument>(
  {
    photoId: {
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
    originalFilename: {
      type: String,
      required: true,
    },
    metadata: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      fileSize: { type: Number, required: true },
      mimeType: { type: String, required: true },
      format: { type: String, required: true },
      quality: Number,
      colorSpace: String,
      orientation: Number,
      cameraInfo: {
        make: String,
        model: String,
        focalLength: String,
        aperture: String,
        iso: Number,
        exposureTime: String,
      },
      gpsInfo: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
      },
    },
    storage: {
      originalUrl: { type: String, required: true },
      thumbnailUrl: { type: String, required: true },
      mediumUrl: String,
      cloudPath: { type: String, required: true },
      bucket: { type: String, required: true },
    },
    processing: {
      status: {
        type: String,
        enum: ['uploaded', 'processing', 'ready', 'failed'],
        default: 'uploaded',
      },
      thumbnailGenerated: {
        type: Boolean,
        default: false,
      },
      compressionApplied: {
        type: Boolean,
        default: false,
      },
      virusScanStatus: {
        type: String,
        enum: ['pending', 'clean', 'infected'],
      },
    },
    uploadInfo: {
      uploadedAt: { type: Date, required: true, default: Date.now },
      processedAt: Date,
      clientIp: String,
      userAgent: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'photos',
  }
);

// Index composés pour les requêtes fréquentes
PhotoSchema.index({ userId: 1, createdAt: -1 });
PhotoSchema.index({ 'processing.status': 1, createdAt: -1 });
PhotoSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthodes d'instance
PhotoSchema.methods.isReady = function (): boolean {
  return this.processing.status === 'ready';
};

PhotoSchema.methods.markAsProcessed = function (): void {
  this.processing.status = 'ready';
  this.uploadInfo.processedAt = new Date();
};

PhotoSchema.methods.markAsFailed = function (): void {
  this.processing.status = 'failed';
};

export const PhotoModel = mongoose.model<IPhotoDocument>('Photo', PhotoSchema);
