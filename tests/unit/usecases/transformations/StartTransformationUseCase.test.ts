import { StartTransformationUseCase } from '../../../../src/application/usecases/transformations/StartTransformationUseCase';
import { IPhotoRepository } from '../../../../src/domain/interfaces/IPhotoRepository';
import { IStyleRepository } from '../../../../src/domain/interfaces/IStyleRepository';
import { ITransformationRepository } from '../../../../src/domain/interfaces/ITransformationRepository';
import { IAIService } from '../../../../src/domain/interfaces/IAIService';
import { IStorageService } from '../../../../src/domain/interfaces/IStorageService';
import { webhookService } from '../../../../src/application/services/WebhookService';

// Mock dependencies
const mockPhotoRepository: jest.Mocked<IPhotoRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
};

const mockStyleRepository: jest.Mocked<IStyleRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
};

const mockTransformationRepository: jest.Mocked<ITransformationRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByPhotoId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findRecent: jest.fn(),
  save: jest.fn(),
};

const mockAIService: jest.Mocked<IAIService> = {
  transformImage: jest.fn(),
  generateStyleFromDescription: jest.fn(),
  analyzeImage: jest.fn(),
};

const mockStorageService: jest.Mocked<IStorageService> = {
  uploadFile: jest.fn(),
  getFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileUrl: jest.fn(),
  fileExists: jest.fn(),
  generateSignedUrl: jest.fn(),
};

jest.mock('../../../../src/application/services/WebhookService');

describe('StartTransformationUseCase', () => {
  let useCase: StartTransformationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new StartTransformationUseCase(
      mockPhotoRepository,
      mockStyleRepository,
      mockTransformationRepository,
      mockAIService,
      mockStorageService
    );
  });

  describe('execute', () => {
    it('should start transformation with existing style', async () => {
      const userId = 'user123';
      const photoId = 'photo123';
      const styleId = 'style123';

      const mockPhoto = {
        photoId,
        userId,
        storage: {
          url: 'http://example.com/photo.jpg',
          path: 'photos/photo.jpg',
        },
      };

      const mockStyle = {
        styleId,
        name: 'Vintage',
        description: 'Vintage style',
      };

      const mockTransformation = {
        transformationId: 'trans123',
        userId,
        photoId,
        styleId,
        processing: {
          status: 'pending',
        },
      };

      mockPhotoRepository.findById.mockResolvedValue(mockPhoto as any);
      mockStyleRepository.findById.mockResolvedValue(mockStyle as any);
      mockTransformationRepository.create.mockResolvedValue(mockTransformation as any);

      const result = await useCase.execute({
        userId,
        photoId,
        styleId,
      });

      expect(mockPhotoRepository.findById).toHaveBeenCalledWith(photoId);
      expect(mockStyleRepository.findById).toHaveBeenCalledWith(styleId);
      expect(mockTransformationRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('transformationId');
      expect(result.processing.status).toBe('pending');
    });

    it('should start transformation with custom prompt', async () => {
      const userId = 'user123';
      const photoId = 'photo123';
      const customPrompt = 'Make it look like a painting';

      const mockPhoto = {
        photoId,
        userId,
        storage: {
          url: 'http://example.com/photo.jpg',
          path: 'photos/photo.jpg',
        },
      };

      const mockTransformation = {
        transformationId: 'trans123',
        userId,
        photoId,
        customPrompt,
        processing: {
          status: 'pending',
        },
      };

      mockPhotoRepository.findById.mockResolvedValue(mockPhoto as any);
      mockTransformationRepository.create.mockResolvedValue(mockTransformation as any);

      const result = await useCase.execute({
        userId,
        photoId,
        customPrompt,
      });

      expect(mockPhotoRepository.findById).toHaveBeenCalledWith(photoId);
      expect(mockStyleRepository.findById).not.toHaveBeenCalled();
      expect(result.customPrompt).toBe(customPrompt);
    });

    it('should throw error if photo not found', async () => {
      const userId = 'user123';
      const photoId = 'nonexistent';
      const styleId = 'style123';

      mockPhotoRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          userId,
          photoId,
          styleId,
        })
      ).rejects.toThrow();
    });

    it('should throw error if photo belongs to different user', async () => {
      const userId = 'user123';
      const photoId = 'photo123';
      const styleId = 'style123';

      const mockPhoto = {
        photoId,
        userId: 'different-user',
        storage: {
          url: 'http://example.com/photo.jpg',
        },
      };

      mockPhotoRepository.findById.mockResolvedValue(mockPhoto as any);

      await expect(
        useCase.execute({
          userId,
          photoId,
          styleId,
        })
      ).rejects.toThrow();
    });

    it('should throw error if style not found', async () => {
      const userId = 'user123';
      const photoId = 'photo123';
      const styleId = 'nonexistent';

      const mockPhoto = {
        photoId,
        userId,
        storage: {
          url: 'http://example.com/photo.jpg',
        },
      };

      mockPhotoRepository.findById.mockResolvedValue(mockPhoto as any);
      mockStyleRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          userId,
          photoId,
          styleId,
        })
      ).rejects.toThrow();
    });

    it('should throw error if neither styleId nor customPrompt provided', async () => {
      const userId = 'user123';
      const photoId = 'photo123';

      await expect(
        useCase.execute({
          userId,
          photoId,
        })
      ).rejects.toThrow();
    });
  });
});
