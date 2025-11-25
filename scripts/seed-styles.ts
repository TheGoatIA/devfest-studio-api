/**
 * Script de seed pour les styles de transformation
 *
 * Usage: npm run seed
 * ou: ts-node scripts/seed-styles.ts
 */

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { StyleModel } from '../src/infrastructure/database/mongodb/models/StyleModel';
import { styles } from '../src/infrastructure/database/seeds/styleData';

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
