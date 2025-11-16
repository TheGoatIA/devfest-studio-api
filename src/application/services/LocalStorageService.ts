/**
 * Service de stockage local utilisant le système de fichiers
 * Stocke les fichiers dans le dossier /uploads du projet
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import {
  IStorageService,
  FileMetadata,
  UploadResult,
  StoredFileMetadata,
} from '../../core/interfaces/services/IStorageService';
import logger from '../../config/logger';
import { config } from '../../config/environment';
import { AppError } from '../../shared/errors/AppError';

export class LocalStorageService implements IStorageService {
  private uploadsDir: string;
  private baseUrl: string;

  constructor() {
    // Dossier de stockage local
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.baseUrl = `http://${config.HOST}:${config.PORT}`;

    // Créer les dossiers nécessaires au démarrage
    this.initializeDirectories();

    logger.info('📦 LocalStorageService initialisé', {
      uploadsDir: this.uploadsDir,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Initialiser les dossiers de stockage
   */
  private async initializeDirectories(): Promise<void> {
    try {
      const directories = [
        this.uploadsDir,
        path.join(this.uploadsDir, 'photos'),
        path.join(this.uploadsDir, 'photos', 'originals'),
        path.join(this.uploadsDir, 'photos', 'thumbnails'),
        path.join(this.uploadsDir, 'transformations'),
        path.join(this.uploadsDir, 'transformations', 'results'),
        path.join(this.uploadsDir, 'transformations', 'thumbnails'),
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }

      logger.info('✅ Dossiers de stockage créés', { count: directories.length });
    } catch (error) {
      logger.error('❌ Erreur lors de la création des dossiers', { error });
      throw new AppError('Impossible de créer les dossiers de stockage', 500);
    }
  }

  /**
   * Upload un fichier vers le stockage local
   */
  async uploadFile(fileBuffer: Buffer, metadata: FileMetadata): Promise<UploadResult> {
    try {
      const filename = this.generateFilename(metadata);
      const filePath = this.getRelativePath(filename, metadata.type);
      const absolutePath = path.join(this.uploadsDir, filePath);

      logger.info('📤 Sauvegarde du fichier', {
        filename,
        size: fileBuffer.length,
        mimeType: metadata.mimeType,
        path: filePath,
      });

      // Sauvegarder le fichier
      await fs.writeFile(absolutePath, fileBuffer);

      // Générer les URLs
      const publicUrl = `${this.baseUrl}/uploads/${filePath.replace(/\\/g, '/')}`;

      // Générer miniature si c'est une image
      let thumbnailUrl: string | undefined;
      if (metadata.type === 'photo' || metadata.type === 'transformation') {
        const thumbnailBuffer = await this.generateThumbnail(fileBuffer, 300, 300);
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = this.getRelativePath(thumbnailFilename, metadata.type, true);
        const thumbnailAbsolutePath = path.join(this.uploadsDir, thumbnailPath);

        await fs.writeFile(thumbnailAbsolutePath, thumbnailBuffer);
        thumbnailUrl = `${this.baseUrl}/uploads/${thumbnailPath.replace(/\\/g, '/')}`;
      }

      // Calculer le MD5
      const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

      logger.info('✅ Fichier sauvegardé avec succès', {
        filename,
        url: publicUrl,
        thumbnail: thumbnailUrl,
      });

      return {
        path: filePath,
        publicUrl,
        thumbnailUrl,
        size: fileBuffer.length,
        md5Hash,
        contentType: metadata.mimeType,
      };
    } catch (error) {
      logger.error('❌ Erreur sauvegarde fichier', { error, metadata });
      throw new AppError('Échec de la sauvegarde du fichier', 500);
    }
  }

  /**
   * Générer une URL signée temporaire (pour compatibilité)
   * En local, retourne simplement l'URL publique
   */
  async generateSignedUrl(filePath: string, _expiry?: number): Promise<string> {
    return `${this.baseUrl}/uploads/${filePath.replace(/\\/g, '/')}`;
  }

  /**
   * Supprimer un fichier du stockage local
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const absolutePath = path.join(this.uploadsDir, filePath);

      logger.info('🗑️  Suppression du fichier', { path: filePath });

      // Vérifier si le fichier existe
      try {
        await fs.access(absolutePath);
      } catch {
        logger.warn('⚠️  Fichier introuvable', { path: filePath });
        return false;
      }

      // Supprimer le fichier
      await fs.unlink(absolutePath);

      // Tenter de supprimer la miniature si elle existe
      const dirname = path.dirname(filePath);
      const basename = path.basename(filePath);
      const thumbnailPath = path.join(
        dirname.replace('originals', 'thumbnails').replace('results', 'thumbnails'),
        `thumb_${basename}`
      );
      const thumbnailAbsolutePath = path.join(this.uploadsDir, thumbnailPath);

      try {
        await fs.unlink(thumbnailAbsolutePath);
      } catch {
        // Ignorer si la miniature n'existe pas
      }

      logger.info('✅ Fichier supprimé avec succès', { path: filePath });
      return true;
    } catch (error) {
      logger.error('❌ Erreur suppression fichier', { error, path: filePath });
      throw new AppError('Échec de la suppression du fichier', 500);
    }
  }

  /**
   * Copier un fichier d'un chemin à un autre
   */
  async copyFile(sourcePath: string, destPath: string): Promise<string> {
    try {
      const sourceAbsolute = path.join(this.uploadsDir, sourcePath);
      const destAbsolute = path.join(this.uploadsDir, destPath);

      logger.info('📋 Copie du fichier', { source: sourcePath, dest: destPath });

      await fs.copyFile(sourceAbsolute, destAbsolute);

      logger.info('✅ Fichier copié avec succès');
      return destPath;
    } catch (error) {
      logger.error('❌ Erreur copie fichier', { error, sourcePath, destPath });
      throw new AppError('Échec de la copie du fichier', 500);
    }
  }

  /**
   * Récupérer les métadonnées d'un fichier
   */
  async getFileMetadata(filePath: string): Promise<StoredFileMetadata> {
    try {
      const absolutePath = path.join(this.uploadsDir, filePath);
      const stats = await fs.stat(absolutePath);

      // Lire le contenu pour calculer le MD5
      const buffer = await fs.readFile(absolutePath);
      const md5Hash = crypto.createHash('md5').update(buffer).digest('hex');

      return {
        path: filePath,
        size: stats.size,
        contentType: this.getMimeType(filePath),
        md5Hash,
        createdAt: stats.birthtime,
        updatedAt: stats.mtime,
      };
    } catch (error) {
      logger.error('❌ Erreur récupération métadonnées', { error, path: filePath });
      throw new AppError('Fichier non trouvé', 404);
    }
  }

  /**
   * Générer une miniature d'une image
   */
  async generateThumbnail(imageBuffer: Buffer, width: number, height: number): Promise<Buffer> {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      logger.error('❌ Erreur génération miniature', { error });
      throw new AppError('Échec de la génération de la miniature', 500);
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = path.join(this.uploadsDir, filePath);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Liste les fichiers dans un dossier
   */
  async listFiles(prefix: string, maxResults: number = 100): Promise<string[]> {
    try {
      const dirPath = path.join(this.uploadsDir, prefix);

      // Vérifier si le dossier existe
      try {
        await fs.access(dirPath);
      } catch {
        return [];
      }

      const files = await fs.readdir(dirPath);

      // Filtrer et limiter les résultats
      return files
        .filter((file) => !file.startsWith('.'))
        .slice(0, maxResults)
        .map((file) => path.join(prefix, file));
    } catch (error) {
      logger.error('❌ Erreur listage fichiers', { error, prefix });
      return [];
    }
  }

  /**
   * MÉTHODES PRIVÉES
   */

  /**
   * Générer un nom de fichier unique
   */
  private generateFilename(metadata: FileMetadata): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(metadata.originalName) || '.jpg';
    const typePrefix = metadata.type === 'transformation' ? 'transform' : 'photo';

    return `${typePrefix}_${timestamp}_${randomId}${ext}`;
  }

  /**
   * Obtenir le chemin relatif d'un fichier
   */
  private getRelativePath(
    filename: string,
    type: FileMetadata['type'],
    isThumbnail: boolean = false
  ): string {
    let basePath = '';

    if (type === 'photo') {
      basePath = isThumbnail ? 'photos/thumbnails' : 'photos/originals';
    } else if (type === 'transformation') {
      basePath = isThumbnail ? 'transformations/thumbnails' : 'transformations/results';
    } else {
      basePath = 'misc';
    }

    return path.join(basePath, filename);
  }

  /**
   * Obtenir le type MIME depuis l'extension
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
