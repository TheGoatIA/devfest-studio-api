/**
 * Service de stockage cloud utilisant Google Cloud Storage
 */

import { Storage, Bucket, File } from '@google-cloud/storage';
import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  IStorageService,
  FileMetadata,
  UploadResult,
  StoredFileMetadata,
} from '../../core/interfaces/services/IStorageService';
import logger from '../../config/logger';
import { config } from '../../config/environment';
import { AppError } from '../../shared/errors/AppError';

export class StorageService implements IStorageService {
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;
  private cdnDomain?: string;

  constructor() {
    // Initialiser Google Cloud Storage
    const storageOptions: any = {
      projectId: config.GOOGLE_CLOUD_PROJECT_ID,
    };

    // Ajouter le fichier de clés si fourni
    if (config.GOOGLE_CLOUD_KEY_FILE) {
      storageOptions.keyFilename = config.GOOGLE_CLOUD_KEY_FILE;
    }

    this.storage = new Storage(storageOptions);
    this.bucketName = config.STORAGE_BUCKET;
    this.bucket = this.storage.bucket(this.bucketName);

    logger.info('📦 StorageService initialisé', {
      bucket: this.bucketName,
      projectId: config.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  /**
   * Upload un fichier vers Google Cloud Storage
   */
  async uploadFile(fileBuffer: Buffer, metadata: FileMetadata): Promise<UploadResult> {
    try {
      const filename = this.generateFilename(metadata);
      const file = this.bucket.file(filename);

      logger.info('📤 Upload du fichier', {
        filename,
        size: fileBuffer.length,
        mimeType: metadata.mimeType,
      });

      // Créer le stream d'upload
      const stream = file.createWriteStream({
        metadata: {
          contentType: metadata.mimeType,
          metadata: {
            userId: metadata.userId,
            originalName: metadata.originalName,
            type: metadata.type,
            uploadedAt: new Date().toISOString(),
            ...(metadata.tags && { tags: metadata.tags.join(',') }),
          },
        },
        resumable: false,
        validation: 'md5',
      });

      // Upload le fichier
      await new Promise<void>((resolve, reject) => {
        stream.on('error', (error) => {
          logger.error('❌ Erreur upload fichier', {
            error: error.message,
            filename,
          });
          reject(new AppError('Échec de l\'upload du fichier', 500));
        });

        stream.on('finish', () => {
          logger.info('✅ Fichier uploadé avec succès', { filename });
          resolve();
        });

        stream.end(fileBuffer);
      });

      // Récupérer les métadonnées du fichier
      const [fileMetadata] = await file.getMetadata();

      // Générer les URLs
      const publicUrl = this.getPublicUrl(filename);

      // Générer miniature si c'est une image
      let thumbnailUrl: string | undefined;
      if (metadata.mimeType.startsWith('image/')) {
        thumbnailUrl = await this.createAndUploadThumbnail(fileBuffer, filename, metadata);
      }

      return {
        path: filename,
        publicUrl,
        thumbnailUrl,
        size: fileBuffer.length,
        md5Hash: fileMetadata.md5Hash,
        contentType: metadata.mimeType,
      };
    } catch (error: any) {
      logger.error('❌ Erreur dans uploadFile', { error: error.message });
      throw new AppError(`Erreur lors de l'upload: ${error.message}`, 500);
    }
  }

  /**
   * Génère une URL signée temporaire
   */
  async generateSignedUrl(filePath: string, expiry: number = 3600): Promise<string> {
    try {
      const file = this.bucket.file(filePath);

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiry * 1000,
      });

      logger.debug('🔗 URL signée générée', { filePath, expiry });

      return url;
    } catch (error: any) {
      logger.error('❌ Erreur génération URL signée', {
        error: error.message,
        filePath,
      });
      throw new AppError('Erreur lors de la génération de l\'URL signée', 500);
    }
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const file = this.bucket.file(filePath);

      // Vérifier si le fichier existe
      const [exists] = await file.exists();
      if (!exists) {
        logger.warn('⚠️  Fichier introuvable pour suppression', { filePath });
        return false;
      }

      await file.delete();

      logger.info('🗑️  Fichier supprimé', { filePath });

      // Supprimer aussi la miniature si elle existe
      const thumbnailPath = filePath.replace(/\.[^.]+$/, '_thumb.jpg');
      const thumbnailFile = this.bucket.file(thumbnailPath);
      const [thumbnailExists] = await thumbnailFile.exists();

      if (thumbnailExists) {
        await thumbnailFile.delete();
        logger.info('🗑️  Miniature supprimée', { thumbnailPath });
      }

      return true;
    } catch (error: any) {
      logger.error('❌ Erreur suppression fichier', {
        error: error.message,
        filePath,
      });
      throw new AppError('Erreur lors de la suppression du fichier', 500);
    }
  }

  /**
   * Copie un fichier
   */
  async copyFile(sourcePath: string, destPath: string): Promise<string> {
    try {
      const sourceFile = this.bucket.file(sourcePath);
      const destFile = this.bucket.file(destPath);

      await sourceFile.copy(destFile);

      logger.info('📋 Fichier copié', { sourcePath, destPath });

      return this.getPublicUrl(destPath);
    } catch (error: any) {
      logger.error('❌ Erreur copie fichier', {
        error: error.message,
        sourcePath,
        destPath,
      });
      throw new AppError('Erreur lors de la copie du fichier', 500);
    }
  }

  /**
   * Récupère les métadonnées d'un fichier
   */
  async getFileMetadata(filePath: string): Promise<StoredFileMetadata> {
    try {
      const file = this.bucket.file(filePath);
      const [metadata] = await file.getMetadata();

      return {
        path: filePath,
        size: parseInt(String(metadata.size || '0')),
        contentType: metadata.contentType || 'application/octet-stream',
        md5Hash: metadata.md5Hash,
        createdAt: new Date(metadata.timeCreated || Date.now()),
        updatedAt: new Date(metadata.updated || Date.now()),
        customMetadata: metadata.metadata
          ? Object.fromEntries(
              Object.entries(metadata.metadata).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined) {
                  acc.push([key, String(value)]);
                }
                return acc;
              }, [] as [string, string][])
            )
          : undefined,
      };
    } catch (error: any) {
      logger.error('❌ Erreur récupération métadonnées', {
        error: error.message,
        filePath,
      });
      throw new AppError('Erreur lors de la récupération des métadonnées', 500);
    }
  }

  /**
   * Génère une miniature d'image
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    width: number = 300,
    height: number = 300
  ): Promise<Buffer> {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return thumbnail;
    } catch (error: any) {
      logger.error('❌ Erreur génération miniature', { error: error.message });
      throw new AppError('Erreur lors de la génération de la miniature', 500);
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();
      return exists;
    } catch (error: any) {
      logger.error('❌ Erreur vérification existence fichier', {
        error: error.message,
        filePath,
      });
      return false;
    }
  }

  /**
   * Liste les fichiers dans un dossier
   */
  async listFiles(prefix: string, maxResults: number = 100): Promise<string[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix,
        maxResults,
      });

      return files.map((file) => file.name);
    } catch (error: any) {
      logger.error('❌ Erreur listage fichiers', {
        error: error.message,
        prefix,
      });
      throw new AppError('Erreur lors du listage des fichiers', 500);
    }
  }

  /**
   * MÉTHODES PRIVÉES
   */

  /**
   * Génère un nom de fichier unique
   */
  private generateFilename(metadata: FileMetadata): string {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    const extension = path.extname(metadata.originalName) || '.jpg';

    return `${metadata.userId}/${metadata.type}/${timestamp}-${uuid}${extension}`;
  }

  /**
   * Génère l'URL publique d'un fichier
   */
  private getPublicUrl(filename: string): string {
    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${filename}`;
    }
    return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
  }

  /**
   * Crée et upload une miniature
   */
  private async createAndUploadThumbnail(
    imageBuffer: Buffer,
    originalFilename: string,
    metadata: FileMetadata
  ): Promise<string> {
    try {
      // Générer la miniature
      const thumbnailBuffer = await this.generateThumbnail(imageBuffer, 300, 300);

      // Nom du fichier miniature
      const thumbnailFilename = originalFilename.replace(/\.[^.]+$/, '_thumb.jpg');

      // Upload la miniature
      const file = this.bucket.file(thumbnailFilename);
      const stream = file.createWriteStream({
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            userId: metadata.userId,
            type: 'thumbnail',
            originalFile: originalFilename,
            uploadedAt: new Date().toISOString(),
          },
        },
        resumable: false,
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(thumbnailBuffer);
      });

      logger.info('✅ Miniature créée et uploadée', { thumbnailFilename });

      return this.getPublicUrl(thumbnailFilename);
    } catch (error: any) {
      logger.warn('⚠️  Erreur création miniature (non-bloquant)', {
        error: error.message,
      });
      // Ne pas bloquer si la miniature échoue
      return '';
    }
  }
}
