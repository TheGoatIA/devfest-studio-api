import { LocalStorageService } from '../../../src/application/services/LocalStorageService';
import { FileMetadata, UploadResult } from '../../../src/domain/interfaces/IStorageService';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// Mock fs/promises
jest.mock('fs/promises');
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
  }));
});

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LocalStorageService();

    // Mock fs functions
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.access.mockResolvedValue(undefined);
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const fileBuffer = Buffer.from('test image data');
      const metadata: FileMetadata = {
        type: 'photo',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        userId: 'user123',
      };

      const result = await service.uploadFile(fileBuffer, metadata);

      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('publicUrl');
      expect(result).toHaveProperty('thumbnailUrl');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('md5Hash');
      expect(result).toHaveProperty('contentType');
      expect(result.contentType).toBe('image/jpeg');
      expect(result.size).toBe(fileBuffer.length);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2); // Main file + thumbnail
    });

    it('should generate correct MD5 hash', async () => {
      const fileBuffer = Buffer.from('test data');
      const metadata: FileMetadata = {
        type: 'photo',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        userId: 'user123',
      };

      const expectedHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
      const result = await service.uploadFile(fileBuffer, metadata);

      expect(result.md5Hash).toBe(expectedHash);
    });

    it('should handle transformation type correctly', async () => {
      const fileBuffer = Buffer.from('transformation data');
      const metadata: FileMetadata = {
        type: 'transformation',
        filename: 'transformed.jpg',
        mimeType: 'image/jpeg',
        userId: 'user123',
      };

      const result = await service.uploadFile(fileBuffer, metadata);

      expect(result.path).toContain('transformations');
    });

    it('should handle style type correctly', async () => {
      const fileBuffer = Buffer.from('style data');
      const metadata: FileMetadata = {
        type: 'style',
        filename: 'style.jpg',
        mimeType: 'image/jpeg',
        userId: 'user123',
      };

      const result = await service.uploadFile(fileBuffer, metadata);

      expect(result.path).toContain('styles');
    });
  });

  describe('getFile', () => {
    it('should return file buffer when file exists', async () => {
      const mockBuffer = Buffer.from('file content');
      mockFs.readFile = jest.fn().mockResolvedValue(mockBuffer);

      const result = await service.getFile('photos/test.jpg');

      expect(result).toEqual(mockBuffer);
      expect(mockFs.readFile).toHaveBeenCalled();
    });

    it('should throw error when file does not exist', async () => {
      mockFs.readFile = jest.fn().mockRejectedValue(new Error('File not found'));

      await expect(service.getFile('nonexistent.jpg')).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete file and thumbnail successfully', async () => {
      const filePath = 'photos/test.jpg';

      await service.deleteFile(filePath);

      expect(mockFs.unlink).toHaveBeenCalledTimes(2); // File + thumbnail
    });

    it('should handle deletion errors gracefully', async () => {
      mockFs.unlink.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteFile('test.jpg')).rejects.toThrow();
    });
  });

  describe('getFileUrl', () => {
    it('should return correct public URL', () => {
      const filePath = 'photos/test.jpg';
      const url = service.getFileUrl(filePath);

      expect(url).toContain('/uploads/');
      expect(url).toContain('photos/test.jpg');
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const exists = await service.fileExists('photos/test.jpg');

      expect(exists).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const exists = await service.fileExists('nonexistent.jpg');

      expect(exists).toBe(false);
    });
  });

  describe('generateSignedUrl', () => {
    it('should return public URL (no signing for local storage)', async () => {
      const filePath = 'photos/test.jpg';
      const url = await service.generateSignedUrl(filePath, 3600);

      expect(url).toContain('/uploads/');
      expect(url).toContain('photos/test.jpg');
    });
  });
});
