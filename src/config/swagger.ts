/**
 * Configuration Swagger/OpenAPI
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'DevFest Studio API',
    version: '1.0.0',
    description: `
      API REST complète pour l'application mobile DevFest Studio avec transformation d'images via IA Gemini.

      ## Features
      - 🎨 Transformation d'images avec IA (Gemini 2.5 Flash Image)
      - 📸 Upload et gestion de photos
      - 🎭 8 styles de transformation prédéfinis
      - 🖼️ Galerie personnelle et favoris
      - 🔐 Authentification JWT sécurisée
      - ⚡ Cache Redis pour performances optimales

      ## Authentication
      La plupart des endpoints nécessitent une authentification via JWT token.
      1. Créer une session avec \`POST /api/v1/auth/session\`
      2. Utiliser le \`sessionToken\` retourné dans le header \`Authorization: Bearer <token>\`
    `,
    contact: {
      name: 'DevFest Douala',
      email: 'support@devfest-douala.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}/api/v1`,
      description: 'Development server',
    },
    {
      url: 'https://devfest-studio.borisgauty.com/api/v1',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication endpoints (sessions, tokens)',
    },
    {
      name: 'Photos',
      description: 'Photo upload and management',
    },
    {
      name: 'Styles',
      description: 'Transformation styles catalog',
    },
    {
      name: 'Transformations',
      description: 'Image transformation with AI',
    },
    {
      name: 'Gallery',
      description: 'Personal gallery and favorites',
    },
    {
      name: 'System',
      description: 'System health and information',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /auth/session',
      },
    },
    schemas: {
      // Error response
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          code: {
            type: 'string',
            example: 'ERROR_CODE',
          },
        },
      },
      // Success response wrapper
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation successful',
          },
          data: {
            type: 'object',
          },
        },
      },
      // Device Info
      DeviceInfo: {
        type: 'object',
        required: ['platform', 'version', 'model', 'appVersion'],
        properties: {
          platform: {
            type: 'string',
            enum: ['ios', 'android', 'web'],
            example: 'android',
          },
          version: {
            type: 'string',
            example: '13',
          },
          model: {
            type: 'string',
            example: 'Pixel 7',
          },
          appVersion: {
            type: 'string',
            example: '1.0.0',
          },
        },
      },
      // Session
      Session: {
        type: 'object',
        properties: {
          sessionToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            example: 'refresh_token_here',
          },
          userId: {
            type: 'string',
            example: 'user_123456',
          },
          expiresIn: {
            type: 'number',
            example: 3600,
          },
        },
      },
      // User
      User: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            example: 'user_123456',
          },
          deviceId: {
            type: 'string',
            example: 'device_abc123',
          },
          subscription: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['free', 'premium', 'pro'],
                example: 'free',
              },
              expiresAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          quotas: {
            type: 'object',
            properties: {
              monthlyTransformations: {
                type: 'number',
                example: 50,
              },
              usedTransformations: {
                type: 'number',
                example: 10,
              },
              storageLimit: {
                type: 'number',
                example: 1073741824,
              },
              usedStorage: {
                type: 'number',
                example: 104857600,
              },
            },
          },
        },
      },
      // Photo
      Photo: {
        type: 'object',
        properties: {
          photoId: {
            type: 'string',
            example: 'photo_123456',
          },
          userId: {
            type: 'string',
            example: 'user_123456',
          },
          originalUrl: {
            type: 'string',
            example: 'https://storage.googleapis.com/bucket/original.jpg',
          },
          thumbnailUrl: {
            type: 'string',
            example: 'https://storage.googleapis.com/bucket/thumb.jpg',
          },
          metadata: {
            type: 'object',
            properties: {
              width: {
                type: 'number',
                example: 1920,
              },
              height: {
                type: 'number',
                example: 1080,
              },
              format: {
                type: 'string',
                example: 'jpeg',
              },
              size: {
                type: 'number',
                example: 2048576,
              },
            },
          },
          uploadedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      // Style
      Style: {
        type: 'object',
        properties: {
          styleId: {
            type: 'string',
            example: 'style_cyberpunk',
          },
          name: {
            type: 'string',
            example: 'Cyberpunk',
          },
          nameFr: {
            type: 'string',
            example: 'Cyberpunk',
          },
          nameEn: {
            type: 'string',
            example: 'Cyberpunk',
          },
          category: {
            type: 'string',
            enum: ['professional', 'artistic', 'tech', 'creative'],
            example: 'tech',
          },
          description: {
            type: 'string',
            example: 'Neon-drenched cityscapes and futuristic vibes.',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['cyberpunk', 'futuristic', 'neon'],
          },
          images: {
            type: 'object',
            properties: {
              previewUrl: {
                type: 'string',
                example: 'https://picsum.photos/seed/cyberpunk/400/400',
              },
              thumbnailUrl: {
                type: 'string',
              },
            },
          },
          pricing: {
            type: 'object',
            properties: {
              isPremium: {
                type: 'boolean',
                example: true,
              },
              tier: {
                type: 'string',
                enum: ['free', 'premium', 'pro'],
                example: 'premium',
              },
              credits: {
                type: 'number',
                example: 3,
              },
            },
          },
          metrics: {
            type: 'object',
            properties: {
              popularity: {
                type: 'number',
                example: 0.92,
              },
              usageCount: {
                type: 'number',
                example: 1540,
              },
              averageRating: {
                type: 'number',
                example: 4.9,
              },
            },
          },
        },
      },
      // Transformation
      Transformation: {
        type: 'object',
        properties: {
          transformationId: {
            type: 'string',
            example: 'transform_123456',
          },
          userId: {
            type: 'string',
            example: 'user_123456',
          },
          photoId: {
            type: 'string',
            example: 'photo_123456',
          },
          styleId: {
            type: 'string',
            example: 'style_cyberpunk',
          },
          status: {
            type: 'string',
            enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
            example: 'completed',
          },
          result: {
            type: 'object',
            properties: {
              transformedImageUrl: {
                type: 'string',
                example: 'https://storage.googleapis.com/bucket/transformed.jpg',
              },
              thumbnailUrl: {
                type: 'string',
                example: 'https://storage.googleapis.com/bucket/transformed_thumb.jpg',
              },
            },
          },
          processingMetrics: {
            type: 'object',
            properties: {
              totalProcessingTime: {
                type: 'number',
                example: 5200,
              },
              modelVersion: {
                type: 'string',
                example: 'gemini-2.5-flash-image',
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const fileExtension = config.NODE_ENV === 'production' ? 'js' : 'ts';

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: [
    `./src/docs/swagger-routes.${fileExtension}`,
    `./src/presentation/http/routes/*.${fileExtension}`,
    `./src/presentation/http/controllers/*.${fileExtension}`,
    // Support pour le build (dist)
    `./dist/docs/swagger-routes.js`,
    `./dist/presentation/http/routes/*.js`,
    `./dist/presentation/http/controllers/*.js`,
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
