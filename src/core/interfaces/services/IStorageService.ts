/**
 * Interface pour le service de stockage cloud
 */

export interface IStorageService {
  /**
   * Upload un fichier vers le cloud storage
   */
  uploadFile(fileBuffer: Buffer, metadata: FileMetadata): Promise<UploadResult>;

  /**
   * Génère une URL signée temporaire pour accéder à un fichier
   */
  generateSignedUrl(path: string, expiry?: number): Promise<string>;

  /**
   * Supprime un fichier du storage
   */
  deleteFile(path: string): Promise<boolean>;

  /**
   * Copie un fichier d'un chemin à un autre
   */
  copyFile(sourcePath: string, destPath: string): Promise<string>;

  /**
   * Récupère les métadonnées d'un fichier
   */
  getFileMetadata(path: string): Promise<StoredFileMetadata>;

  /**
   * Génère une miniature d'une image
   */
  generateThumbnail(imageBuffer: Buffer, width: number, height: number): Promise<Buffer>;

  /**
   * Vérifie si un fichier existe
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Liste les fichiers dans un dossier
   */
  listFiles(prefix: string, maxResults?: number): Promise<string[]>;
}

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  userId: string;
  type: 'photo' | 'transformation' | 'thumbnail' | 'style-preview';
  tags?: string[];
}

export interface UploadResult {
  path: string;
  publicUrl: string;
  thumbnailUrl?: string;
  size: number;
  md5Hash?: string;
  contentType: string;
}

export interface StoredFileMetadata {
  path: string;
  size: number;
  contentType: string;
  md5Hash?: string;
  createdAt: Date;
  updatedAt: Date;
  customMetadata?: Record<string, string>;
}
