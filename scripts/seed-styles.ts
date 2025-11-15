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
  // ========== PROFESSIONAL ==========
  {
    styleId: uuidv4(),
    name: 'Portrait Corporate',
    nameFr: 'Portrait Corporate',
    nameEn: 'Corporate Portrait',
    category: 'professional',
    description: 'Transformez votre photo en portrait professionnel digne de LinkedIn',
    descriptionFr: 'Transformez votre photo en portrait professionnel digne de LinkedIn',
    descriptionEn: 'Transform your photo into a professional LinkedIn-worthy portrait',
    tags: ['business', 'professional', 'corporate', 'linkedin'],
    images: {
      previewUrl: 'https://via.placeholder.com/800x600?text=Corporate+Portrait',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=Corporate+Portrait',
      mediumUrl: 'https://via.placeholder.com/600x400?text=Corporate+Portrait',
      largeUrl: 'https://via.placeholder.com/1200x800?text=Corporate+Portrait',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-pro-vision-v1',
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
      popularity: 0.95,
      usageCount: 1250,
      averageRating: 4.7,
      ratingCount: 420,
      successRate: 0.98,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this photo into a professional corporate headshot. Enhance the lighting, sharpen the details, apply a professional background blur, and make it suitable for LinkedIn or business cards. Maintain a natural look while enhancing professionalism.',
      model: 'gemini-pro-vision',
      parameters: {
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== ARTISTIC ==========
  {
    styleId: uuidv4(),
    name: 'Aquarelle Moderne',
    nameFr: 'Aquarelle Moderne',
    nameEn: 'Modern Watercolor',
    category: 'artistic',
    description: 'Donnez à votre photo un style aquarelle artistique',
    descriptionFr: 'Donnez à votre photo un style aquarelle artistique',
    descriptionEn: 'Give your photo an artistic watercolor style',
    tags: ['art', 'watercolor', 'painting', 'artistic'],
    images: {
      previewUrl: 'https://via.placeholder.com/800x600?text=Watercolor',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=Watercolor',
      mediumUrl: 'https://via.placeholder.com/600x400?text=Watercolor',
      largeUrl: 'https://via.placeholder.com/1200x800?text=Watercolor',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-pro-vision-v1',
      processingComplexity: 'high',
      supportedResolutions: ['1920x1920', '2560x2560', '4096x4096'],
      estimatedProcessingTime: 45,
      requiredMemory: 1024,
      gpuRequired: true,
    },
    pricing: {
      isPremium: true,
      credits: 2,
      tier: 'premium',
    },
    metrics: {
      popularity: 0.88,
      usageCount: 890,
      averageRating: 4.8,
      ratingCount: 312,
      successRate: 0.95,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this photo into a beautiful watercolor painting. Use soft, flowing brushstrokes, blend colors naturally, and create a dreamy, artistic atmosphere. Maintain the essence of the original while giving it an elegant watercolor aesthetic.',
      model: 'gemini-pro-vision',
      parameters: {
        temperature: 0.8,
        topP: 0.85,
        topK: 50,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== TECH ==========
  {
    styleId: uuidv4(),
    name: 'Cyberpunk Futuriste',
    nameFr: 'Cyberpunk Futuriste',
    nameEn: 'Futuristic Cyberpunk',
    category: 'tech',
    description: 'Plongez dans un univers cyberpunk néon et futuriste',
    descriptionFr: 'Plongez dans un univers cyberpunk néon et futuriste',
    descriptionEn: 'Dive into a neon futuristic cyberpunk universe',
    tags: ['cyberpunk', 'futuristic', 'neon', 'tech', 'sci-fi'],
    images: {
      previewUrl: 'https://via.placeholder.com/800x600?text=Cyberpunk',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=Cyberpunk',
      mediumUrl: 'https://via.placeholder.com/600x400?text=Cyberpunk',
      largeUrl: 'https://via.placeholder.com/1200x800?text=Cyberpunk',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-pro-vision-v1',
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
      usageCount: 1540,
      averageRating: 4.9,
      ratingCount: 587,
      successRate: 0.96,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this photo into a stunning cyberpunk scene. Add neon lights (pink, blue, purple), holographic elements, futuristic atmosphere, rain effects, and a dark urban background. Create a dramatic sci-fi aesthetic while keeping the subject recognizable.',
      model: 'gemini-pro-vision',
      parameters: {
        temperature: 0.9,
        topP: 0.9,
        topK: 60,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== CREATIVE ==========
  {
    styleId: uuidv4(),
    name: 'Pop Art Vibrant',
    nameFr: 'Pop Art Vibrant',
    nameEn: 'Vibrant Pop Art',
    category: 'creative',
    description: 'Style pop art coloré et audacieux façon Andy Warhol',
    descriptionFr: 'Style pop art coloré et audacieux façon Andy Warhol',
    descriptionEn: 'Bold and colorful pop art style à la Andy Warhol',
    tags: ['pop-art', 'warhol', 'colorful', 'bold', 'retro'],
    images: {
      previewUrl: 'https://via.placeholder.com/800x600?text=Pop+Art',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=Pop+Art',
      mediumUrl: 'https://via.placeholder.com/600x400?text=Pop+Art',
      largeUrl: 'https://via.placeholder.com/1200x800?text=Pop+Art',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-pro-vision-v1',
      processingComplexity: 'medium',
      supportedResolutions: ['1920x1920', '2560x2560'],
      estimatedProcessingTime: 35,
      requiredMemory: 768,
      gpuRequired: false,
    },
    pricing: {
      isPremium: false,
      tier: 'free',
    },
    metrics: {
      popularity: 0.85,
      usageCount: 723,
      averageRating: 4.6,
      ratingCount: 289,
      successRate: 0.97,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this photo into vibrant pop art style. Use bold, contrasting colors, thick outlines, halftone dot patterns, and simplified shapes. Create a 1960s pop art aesthetic reminiscent of Andy Warhol and Roy Lichtenstein.',
      model: 'gemini-pro-vision',
      parameters: {
        temperature: 0.7,
        topP: 0.85,
        topK: 45,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== THEMATIC - DevFest ==========
  {
    styleId: uuidv4(),
    name: 'DevFest Hero',
    nameFr: 'Héros DevFest',
    nameEn: 'DevFest Hero',
    category: 'thematic',
    description: 'Devenez un super-héros développeur pour le DevFest!',
    descriptionFr: 'Devenez un super-héros développeur pour le DevFest!',
    descriptionEn: 'Become a developer superhero for DevFest!',
    tags: ['devfest', 'google', 'developer', 'superhero', 'tech'],
    images: {
      previewUrl: 'https://via.placeholder.com/800x600?text=DevFest+Hero',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=DevFest+Hero',
      mediumUrl: 'https://via.placeholder.com/600x400?text=DevFest+Hero',
      largeUrl: 'https://via.placeholder.com/1200x800?text=DevFest+Hero',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-pro-vision-v1',
      processingComplexity: 'high',
      supportedResolutions: ['1920x1920', '2560x2560', '4096x4096'],
      estimatedProcessingTime: 50,
      requiredMemory: 1024,
      gpuRequired: true,
    },
    pricing: {
      isPremium: false,
      tier: 'free',
    },
    metrics: {
      popularity: 0.99,
      usageCount: 2340,
      averageRating: 4.95,
      ratingCount: 856,
      successRate: 0.99,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this photo into a DevFest superhero! Add a cape with Google colors (blue, red, yellow, green), tech-themed superpowers (code floating around, holographic screens), energetic pose, DevFest logo elements, and a heroic atmosphere. Make it fun and developer-friendly!',
      model: 'gemini-pro-vision',
      parameters: {
        temperature: 0.8,
        topP: 0.9,
        topK: 50,
        maxOutputTokens: 1024,
      },
    },
    createdBy: 'system',
  },

  // ========== Autres styles ==========
  {
    styleId: uuidv4(),
    name: 'Anime Style',
    nameFr: 'Style Anime',
    nameEn: 'Anime Style',
    category: 'artistic',
    description: 'Transformez-vous en personnage d\'anime japonais',
    descriptionFr: 'Transformez-vous en personnage d\'anime japonais',
    descriptionEn: 'Transform yourself into a Japanese anime character',
    tags: ['anime', 'manga', 'japanese', 'cartoon'],
    images: {
      previewUrl: 'https://via.placeholder.com/800x600?text=Anime',
      thumbnailUrl: 'https://via.placeholder.com/300x200?text=Anime',
      mediumUrl: 'https://via.placeholder.com/600x400?text=Anime',
      largeUrl: 'https://via.placeholder.com/1200x800?text=Anime',
      exampleTransformations: [],
    },
    technical: {
      modelVersion: 'gemini-pro-vision-v1',
      processingComplexity: 'medium',
      supportedResolutions: ['1920x1920', '2560x2560'],
      estimatedProcessingTime: 40,
      requiredMemory: 896,
      gpuRequired: true,
    },
    pricing: {
      isPremium: false,
      tier: 'free',
    },
    metrics: {
      popularity: 0.91,
      usageCount: 1680,
      averageRating: 4.75,
      ratingCount: 612,
      successRate: 0.94,
    },
    availability: {
      isActive: true,
      regions: ['all'],
      maintenanceMode: false,
    },
    geminiConfig: {
      prompt: 'Transform this photo into anime/manga style. Use large expressive eyes, smooth cel-shaded coloring, simplified features, vibrant hair colors, and clean line art. Create a Japanese anime aesthetic while maintaining recognizability.',
      model: 'gemini-pro-vision',
      parameters: {
        temperature: 0.75,
        topP: 0.88,
        topK: 48,
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
    const categories = ['professional', 'artistic', 'tech', 'creative', 'thematic'];

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
