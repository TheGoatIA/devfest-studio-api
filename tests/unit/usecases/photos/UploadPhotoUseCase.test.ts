import { UploadPhotoUseCase } from '../../../../src/application/usecases/photos/UploadPhotoUseCase';
import { IPhotoRepository } from '../../../../src/domain/interfaces/IPhotoRepository';
import { IStorageService } from '../../../../src/domain/interfaces/IStorageService';
import { Photo } from '../../../../src/domain/entities/Photo';

// Mock repositories and services
const mockPhotoRepository: jest.Mocked<IPhotoRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
};

const mockStorageService: jest.Mocked<IStorageService> = {
  uploadFile: jest.fn(),
  getFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileUrl: jest.fn(),
  fileExists: jest.fn(),
  generateSignedUrl: jest.fn(),
};

describe('UploadPhotoUseCase', () => {
  let useCase: UploadPhotoUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UploadPhotoUseCase(mockPhotoRepository, mockStorageService);
  });

  describe('execute', () => {
    it('should upload photo successfully', async () => {
      const userId = 'user123';
      const fileBuffer = Buffer.from('test image data');
      const filename = 'test.jpg';
      const mimeType = 'image/jpeg';

      const mockUploadResult = {
        path: 'photos/test.jpg',
        publicUrl: 'http://localhost:3000/uploads/photos/test.jpg',
        thumbnailUrl: 'http://localhost:3000/uploads/photos/thumbnails/test.jpg',
        size: fileBuffer.length,
        md5Hash: 'abc123',
        contentType: mimeType,
      };

      const mockPhoto = {
        photoId: 'photo123',
        userId,
        storage: {
          url: mockUploadResult.publicUrl,
          thumbnailUrl: mockUploadResult.thumbnailUrl,
          path: mockUploadResult.path,
          size: mockUploadResult.size,
          mimeType,
          md5Hash: mockUploadResult.md5Hash,
        },
        metadata: {
          originalFilename: filename,
          uploadDate: expect.any(Date),
        },
        transformations: [],
      };

      mockStorageService.uploadFile.mockResolvedValue(mockUploadResult);
      mockPhotoRepository.create.mockResolvedValue(mockPhoto as any);

      const result = await useCase.execute({
        userId,
        fileBuffer,
        filename,
        mimeType,
      });

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        fileBuffer,
        expect.objectContaining({
          type: 'photo',
          filename,
          mimeType,
          userId,
        })
      );

      expect(mockPhotoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          storage: expect.objectContaining({
            url: mockUploadResult.publicUrl,
            path: mockUploadResult.path,
          }),
        })
      );

      expect(result).toHaveProperty('photoId');
      expect(result.userId).toBe(userId);
    });

    it('should handle storage upload errors', async () => {
      const userId = 'user123';
      const fileBuffer = Buffer.from('test data');
      const filename = 'test.jpg';
      const mimeType = 'image/jpeg';

      mockStorageService.uploadFile.mockRejectedValue(new Error('Upload failed'));

      await expect(
        useCase.execute({
          userId,
          fileBuffer,
          filename,
          mimeType,
        })
      ).rejects.toThrow('Upload failed');

      expect(mockPhotoRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const userId = 'user123';
      const fileBuffer = Buffer.from('test data');
      const filename = 'test.jpg';
      const mimeType = 'image/jpeg';

      const mockUploadResult = {
        path: 'photos/test.jpg',
        publicUrl: 'http://localhost:3000/uploads/photos/test.jpg',
        thumbnailUrl: 'http://localhost:3000/uploads/photos/thumbnails/test.jpg',
        size: fileBuffer.length,
        md5Hash: 'abc123',
        contentType: mimeType,
      };

      mockStorageService.uploadFile.mockResolvedValue(mockUploadResult);
      mockPhotoRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(
        useCase.execute({
          userId,
          fileBuffer,
          filename,
          mimeType,
        })
      ).rejects.toThrow('Database error');
    });

    it('should validate file size', async () => {
      const userId = 'user123';
      const largeFileBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB
      const filename = 'large.jpg';
      const mimeType = 'image/jpeg';

      // Assuming max file size is 10MB
      await expect(
        useCase.execute({
          userId,
          fileBuffer: largeFileBuffer,
          filename,
          mimeType,
        })
      ).rejects.toThrow();
    });

    it('should validate mime type', async () => {
      const userId = 'user123';
      const fileBuffer = Buffer.from('test data');
      const filename = 'test.txt';
      const mimeType = 'text/plain';

      await expect(
        useCase.execute({
          userId,
          fileBuffer,
          filename,
          mimeType,
        })
      ).rejects.toThrow();
    });
  });
});
