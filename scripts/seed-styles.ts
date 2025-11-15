/**
 * Script de seed pour les styles de transformation
 *
 * Usage: npm run seed
 * ou: ts-node scripts/seed-styles.ts
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { StyleModel } from '../src/infrastructure/database/mongodb/models/StyleModel';
import logger from '../src/config/logger';
import { config } from '../src/config/environment';

/**
 * Styles prédéfinis à insérer
 */
const styles = [
  // ========== CYBERPUNK ==========
  {
    styleId: uuidv4(),
    name: 'Cyberpunk',
    nameFr: 'Cyberpunk',
    nameEn: 'Cyberpunk',
    category: 'tech',
    description: 'Neon-drenched cityscapes and futuristic vibes.',
    descriptionFr: 'Paysages urbains baignés de néon et ambiance futuriste.',
    descriptionEn: 'Neon-drenched cityscapes and futuristic vibes.',
    tags: ['cyberpunk', 'futuristic', 'neon', 'tech', 'sci-fi'],
    images: {
      previewUrl: 'https://picsum.photos/seed/cyberpunk/400/400',
      thumbnailUrl: 'https://picsum.photos/seed/cyberpunk/300/200',
      mediumUrl: 'https://picsum.photos/seed/cyberpunk/600/400',
      largeUrl: 'https://picsum.photos/seed/cyberpunk/1200/800',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-2.5-flash-image',
      processingComplexity: 'high',
      supportedResolutions: ['1920x1920', '2560x2560', '4096x4096'],
      estimatedProcessingTime: 60,
      requiredMemory: 1536,
      gpuRequired: true,
    },
    pricing: {
      isPremium: true,
      credits: 3,
      tier: 'premium',
    },
    metrics: {
      popularity: 0.92,
      usageCount: 0,
      averageRating: 4.9,
      ratingCount: 0,
      successRate: 0.96,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this image into a cyberpunk style with neon-drenched cityscapes, futuristic elements, and a dark, high-tech atmosphere. Add vibrant neon lights in pink, blue, and purple, holographic displays, rain-slicked streets, and a dystopian urban environment. The subject should be integrated into this cyberpunk world while maintaining their recognizable features.',
      model: 'gemini-2.5-flash-image',
      parameters: {
        temperature: 0.9,
        topP: 0.9,
        topK: 60,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== FANTASY ART ==========
  {
    styleId: uuidv4(),
    name: 'Fantasy Art',
    nameFr: 'Art Fantastique',
    nameEn: 'Fantasy Art',
    category: 'artistic',
    description: 'Epic fantasy worlds with magic and wonder.',
    descriptionFr: 'Mondes fantastiques épiques avec magie et émerveillement.',
    descriptionEn: 'Epic fantasy worlds with magic and wonder.',
    tags: ['fantasy', 'magic', 'epic', 'artistic', 'medieval'],
    images: {
      previewUrl: 'https://picsum.photos/seed/fantasy/400/400',
      thumbnailUrl: 'https://picsum.photos/seed/fantasy/300/200',
      mediumUrl: 'https://picsum.photos/seed/fantasy/600/400',
      largeUrl: 'https://picsum.photos/seed/fantasy/1200/800',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-2.5-flash-image',
      processingComplexity: 'high',
      supportedResolutions: ['1920x1920', '2560x2560', '4096x4096'],
      estimatedProcessingTime: 55,
      requiredMemory: 1280,
      gpuRequired: true,
    },
    pricing: {
      isPremium: true,
      credits: 3,
      tier: 'premium',
    },
    metrics: {
      popularity: 0.88,
      usageCount: 0,
      averageRating: 4.8,
      ratingCount: 0,
      successRate: 0.94,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this image into epic fantasy art with magical elements, mystical environments, and a sense of wonder. Add fantasy elements like glowing magical effects, enchanted forests or castles, dramatic lighting, ethereal atmospheres, and a painterly quality. The subject should appear as a fantasy character or be integrated into a magical world.',
      model: 'gemini-2.5-flash-image',
      parameters: {
        temperature: 0.85,
        topP: 0.9,
        topK: 55,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== WATERCOLOR ==========
  {
    styleId: uuidv4(),
    name: 'Watercolor',
    nameFr: 'Aquarelle',
    nameEn: 'Watercolor',
    category: 'artistic',
    description: 'Soft, flowing watercolor painting style.',
    descriptionFr: 'Style de peinture aquarelle douce et fluide.',
    descriptionEn: 'Soft, flowing watercolor painting style.',
    tags: ['watercolor', 'art', 'painting', 'soft', 'artistic'],
    images: {
      previewUrl: 'https://picsum.photos/seed/watercolor/400/400',
      thumbnailUrl: 'https://picsum.photos/seed/watercolor/300/200',
      mediumUrl: 'https://picsum.photos/seed/watercolor/600/400',
      largeUrl: 'https://picsum.photos/seed/watercolor/1200/800',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-2.5-flash-image',
      processingComplexity: 'medium',
      supportedResolutions: ['1920x1920', '2560x2560', '4096x4096'],
      estimatedProcessingTime: 45,
      requiredMemory: 1024,
      gpuRequired: false,
    },
    pricing: {
      isPremium: false,
      tier: 'free',
    },
    metrics: {
      popularity: 0.85,
      usageCount: 0,
      averageRating: 4.7,
      ratingCount: 0,
      successRate: 0.95,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this image into a beautiful watercolor painting with soft, flowing brushstrokes, natural color bleeding, and a dreamy, artistic quality. Use delicate washes of color, visible paper texture, gentle gradients, and the characteristic translucent quality of watercolor. Maintain the essence of the subject while giving it an elegant, hand-painted watercolor aesthetic.',
      model: 'gemini-2.5-flash-image',
      parameters: {
        temperature: 0.75,
        topP: 0.85,
        topK: 50,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== PIXEL ART ==========
  {
    styleId: uuidv4(),
    name: 'Pixel Art',
    nameFr: 'Pixel Art',
    nameEn: 'Pixel Art',
    category: 'creative',
    description: 'Retro 8-bit and 16-bit pixel art style.',
    descriptionFr: 'Style rétro pixel art 8-bit et 16-bit.',
    descriptionEn: 'Retro 8-bit and 16-bit pixel art style.',
    tags: ['pixel', 'retro', '8bit', '16bit', 'gaming', 'vintage'],
    images: {
      previewUrl: 'https://picsum.photos/seed/pixel/400/400',
      thumbnailUrl: 'https://picsum.photos/seed/pixel/300/200',
      mediumUrl: 'https://picsum.photos/seed/pixel/600/400',
      largeUrl: 'https://picsum.photos/seed/pixel/1200/800',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-2.5-flash-image',
      processingComplexity: 'medium',
      supportedResolutions: ['1920x1920', '2560x2560'],
      estimatedProcessingTime: 40,
      requiredMemory: 768,
      gpuRequired: false,
    },
    pricing: {
      isPremium: false,
      tier: 'free',
    },
    metrics: {
      popularity: 0.90,
      usageCount: 0,
      averageRating: 4.8,
      ratingCount: 0,
      successRate: 0.97,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this image into retro pixel art style with a limited color palette, visible pixels, and a nostalgic 8-bit or 16-bit video game aesthetic. Use dithering effects, hard edges, low resolution charm, and classic gaming vibes. The result should evoke memories of classic video games while maintaining the subject\'s recognizability.',
      model: 'gemini-2.5-flash-image',
      parameters: {
        temperature: 0.7,
        topP: 0.85,
        topK: 45,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== PRO HEADSHOT ==========
  {
    styleId: uuidv4(),
    name: 'Pro Headshot',
    nameFr: 'Portrait Professionnel',
    nameEn: 'Pro Headshot',
    category: 'professional',
    description: 'Studio-quality professional headshots.',
    descriptionFr: 'Portraits professionnels de qualité studio.',
    descriptionEn: 'Studio-quality professional headshots.',
    tags: ['professional', 'business', 'corporate', 'linkedin', 'headshot'],
    images: {
      previewUrl: 'https://picsum.photos/seed/headshot/400/400',
      thumbnailUrl: 'https://picsum.photos/seed/headshot/300/200',
      mediumUrl: 'https://picsum.photos/seed/headshot/600/400',
      largeUrl: 'https://picsum.photos/seed/headshot/1200/800',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-2.5-flash-image',
      processingComplexity: 'medium',
      supportedResolutions: ['1920x1920', '2560x2560'],
      estimatedProcessingTime: 30,
      requiredMemory: 512,
      gpuRequired: false,
    },
    pricing: {
      isPremium: false,
      tier: 'free',
    },
    metrics: {
      popularity: 0.96,
      usageCount: 0,
      averageRating: 4.9,
      ratingCount: 0,
      successRate: 0.98,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this image into a studio-quality professional headshot suitable for LinkedIn, business cards, and corporate profiles. Enhance lighting with professional studio-style illumination, apply subtle background blur or a clean neutral background, sharpen facial details, improve skin tone naturally, and create a polished, confident, and approachable professional appearance.',
      model: 'gemini-2.5-flash-image',
      parameters: {
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== FILM NOIR ==========
  {
    styleId: uuidv4(),
    name: 'Film Noir',
    nameFr: 'Film Noir',
    nameEn: 'Film Noir',
    category: 'creative',
    description: 'Classic black and white detective movie aesthetic.',
    descriptionFr: 'Esthétique classique des films policiers en noir et blanc.',
    descriptionEn: 'Classic black and white detective movie aesthetic.',
    tags: ['noir', 'detective', 'vintage', 'dramatic', 'blackandwhite'],
    images: {
      previewUrl: 'https://picsum.photos/seed/noir/400/400',
      thumbnailUrl: 'https://picsum.photos/seed/noir/300/200',
      mediumUrl: 'https://picsum.photos/seed/noir/600/400',
      largeUrl: 'https://picsum.photos/seed/noir/1200/800',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-2.5-flash-image',
      processingComplexity: 'medium',
      supportedResolutions: ['1920x1920', '2560x2560'],
      estimatedProcessingTime: 35,
      requiredMemory: 640,
      gpuRequired: false,
    },
    pricing: {
      isPremium: false,
      tier: 'free',
    },
    metrics: {
      popularity: 0.82,
      usageCount: 0,
      averageRating: 4.7,
      ratingCount: 0,
      successRate: 0.96,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this image into classic film noir style with dramatic black and white contrast, venetian blind shadows, moody atmospheric lighting, and a 1940s detective movie aesthetic. Use high contrast, deep shadows, dramatic side lighting, grain texture, and create a mysterious, suspenseful atmosphere reminiscent of classic noir cinema.',
      model: 'gemini-2.5-flash-image',
      parameters: {
        temperature: 0.7,
        topP: 0.85,
        topK: 45,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== VINTAGE PHOTO ==========
  {
    styleId: uuidv4(),
    name: 'Vintage Photo',
    nameFr: 'Photo Vintage',
    nameEn: 'Vintage Photo',
    category: 'creative',
    description: 'Nostalgic aged photograph with retro tones.',
    descriptionFr: 'Photographie vieillie nostalgique avec tons rétro.',
    descriptionEn: 'Nostalgic aged photograph with retro tones.',
    tags: ['vintage', 'retro', 'aged', 'nostalgic', 'classic'],
    images: {
      previewUrl: 'https://picsum.photos/seed/vintage/400/400',
      thumbnailUrl: 'https://picsum.photos/seed/vintage/300/200',
      mediumUrl: 'https://picsum.photos/seed/vintage/600/400',
      largeUrl: 'https://picsum.photos/seed/vintage/1200/800',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-2.5-flash-image',
      processingComplexity: 'low',
      supportedResolutions: ['1920x1920', '2560x2560'],
      estimatedProcessingTime: 25,
      requiredMemory: 512,
      gpuRequired: false,
    },
    pricing: {
      isPremium: false,
      tier: 'free',
    },
    metrics: {
      popularity: 0.87,
      usageCount: 0,
      averageRating: 4.6,
      ratingCount: 0,
      successRate: 0.97,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this image into a nostalgic vintage photograph with aged, retro tones and a classic timeless feel. Add sepia or faded color tones, subtle vignetting, light grain texture, slightly faded appearance, soft focus, and characteristics of old film photography from the 1960s-1980s era. Create a warm, nostalgic atmosphere.',
      model: 'gemini-2.5-flash-image',
      parameters: {
        temperature: 0.6,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== PRODUCT SHOT ==========
  {
    styleId: uuidv4(),
    name: 'Product Shot',
    nameFr: 'Photo Produit',
    nameEn: 'Product Shot',
    category: 'professional',
    description: 'Clean commercial product photography style.',
    descriptionFr: 'Style de photographie de produit commercial propre.',
    descriptionEn: 'Clean commercial product photography style.',
    tags: ['product', 'commercial', 'clean', 'professional', 'marketing'],
    images: {
      previewUrl: 'https://picsum.photos/seed/product/400/400',
      thumbnailUrl: 'https://picsum.photos/seed/product/300/200',
      mediumUrl: 'https://picsum.photos/seed/product/600/400',
      largeUrl: 'https://picsum.photos/seed/product/1200/800',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-2.5-flash-image',
      processingComplexity: 'medium',
      supportedResolutions: ['1920x1920', '2560x2560'],
      estimatedProcessingTime: 30,
      requiredMemory: 640,
      gpuRequired: false,
    },
    pricing: {
      isPremium: false,
      tier: 'free',
    },
    metrics: {
      popularity: 0.93,
      usageCount: 0,
      averageRating: 4.8,
      ratingCount: 0,
      successRate: 0.98,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this image into a clean, professional commercial product photography style suitable for e-commerce and marketing. Use perfect studio lighting, clean white or subtle gradient background, sharp focus on the subject, enhanced colors and details, professional composition, and create a polished, appealing look that highlights the subject as if it were a premium product.',
      model: 'gemini-2.5-flash-image',
      parameters: {
        temperature: 0.5,
        topP: 0.85,
        topK: 40,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },
];

/**
 * Fonction principale de seed
 */
async function seedStyles() {
  try {
    console.log('🌱 Démarrage du seed des styles...\n');

    // Connexion à MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Supprimer les styles existants
    const deleteResult = await StyleModel.deleteMany({});
    console.log(`🗑️  ${deleteResult.deletedCount} styles existants supprimés\n`);

    // Insérer les nouveaux styles
    const inserted = await StyleModel.insertMany(styles);
    console.log(`✅ ${inserted.length} styles insérés avec succès!\n`);

    // Afficher un résumé
    console.log('📊 Résumé par catégorie:');
    const categories = ['professional', 'artistic', 'tech', 'creative'];

    for (const category of categories) {
      const count = styles.filter((s) => s.category === category).length;
      console.log(`   - ${category}: ${count} style(s)`);
    }

    console.log('\n🎉 Seed terminé avec succès!');

    // Déconnexion
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB\n');

  } catch (error: any) {
    console.error('❌ Erreur lors du seed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le seed
seedStyles();
