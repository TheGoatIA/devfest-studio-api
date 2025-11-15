/**
 * Tests pour CreateSessionUseCase
 */

import { CreateSessionUseCase } from '../../../../src/application/usecases/auth/CreateSessionUseCase';

describe('CreateSessionUseCase', () => {
  let createSessionUseCase: CreateSessionUseCase;
  let mockUserRepository: any;
  let mockSessionRepository: any;
  let mockJwtService: any;
  let mockCacheService: any;

  beforeEach(() => {
    // Mock des repositories et services
    mockUserRepository = {
      findByDeviceId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockSessionRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
    };

    mockJwtService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      }),
    };

    mockCacheService = {
      cacheUserSession: jest.fn().mockResolvedValue(undefined),
    };

    createSessionUseCase = new CreateSessionUseCase(
    
    );
  });

  describe('execute', () => {
    it('devrait créer une nouvelle session pour un nouvel utilisateur', async () => {
      // Arrange
      const input = {
        deviceId: 'test-device-123',
        deviceInfo: {
          platform: 'android' as const,
          version: '13',
          model: 'Pixel 7',
          appVersion: '1.0.0',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      mockUserRepository.findByDeviceId.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        userId: 'new-user-123',
        deviceId: input.deviceId,
        subscription: { type: 'free' },
      });

      mockSessionRepository.create.mockResolvedValue({
        sessionId: 'session-123',
        userId: 'new-user-123',
        deviceId: input.deviceId,
      });

      // Act
      const result = await createSessionUseCase.execute(input);

      // Assert
      expect(result).toHaveProperty('sessionToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('userId');
      expect(result.sessionToken).toBe('test-access-token');
      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
      expect(mockSessionRepository.create).toHaveBeenCalledTimes(1);
    });

    it('devrait créer une session pour un utilisateur existant', async () => {
      // Arrange
      const input = {
        deviceId: 'test-device-123',
        deviceInfo: {
          platform: 'android' as const,
          version: '13',
          model: 'Pixel 7',
          appVersion: '1.0.0',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      mockUserRepository.findByDeviceId.mockResolvedValue({
        userId: 'existing-user-123',
        deviceId: input.deviceId,
        subscription: { type: 'premium' },
      });

      mockSessionRepository.create.mockResolvedValue({
        sessionId: 'session-456',
        userId: 'existing-user-123',
        deviceId: input.deviceId,
      });

      // Act
      const result = await createSessionUseCase.execute(input);

      // Assert
      expect(result.userId).toBe('existing-user-123');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockSessionRepository.create).toHaveBeenCalledTimes(1);
    });

    it('devrait mettre en cache la session', async () => {
      // Arrange
      const input = {
        deviceId: 'test-device-123',
        deviceInfo: {
          platform: 'ios' as const,
          version: '16',
          model: 'iPhone 14',
          appVersion: '1.0.0',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      mockUserRepository.findByDeviceId.mockResolvedValue({
        userId: 'user-123',
        deviceId: input.deviceId,
      });

      mockSessionRepository.create.mockResolvedValue({
        sessionId: 'session-789',
        userId: 'user-123',
      });

      // Act
      await createSessionUseCase.execute(input);

      // Assert
      expect(mockCacheService.cacheUserSession).toHaveBeenCalled();
    });
  });
});
