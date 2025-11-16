## 📝 Description

<!-- Décrivez clairement les changements apportés par cette PR -->

## 🎯 Type de changement

<!-- Cochez les cases appropriées -->

- [ ] 🐛 Correction de bug (changement non-breaking qui corrige un problème)
- [ ] ✨ Nouvelle fonctionnalité (changement non-breaking qui ajoute une fonctionnalité)
- [ ] 💥 Breaking change (correction ou fonctionnalité qui pourrait casser le code existant)
- [ ] 📚 Documentation (mise à jour de la documentation uniquement)
- [ ] ♻️ Refactoring (amélioration du code sans changer le comportement)
- [ ] ⚡ Performance (amélioration des performances)
- [ ] 🎨 Style (formatage, point-virgules manquants, etc.)
- [ ] ✅ Tests (ajout ou correction de tests)
- [ ] 🔧 Configuration (changements de configuration, CI/CD, etc.)
- [ ] 🔒 Sécurité (correction de vulnérabilité)

## 🔗 Issues liées

<!-- Référencez les issues liées à cette PR -->

Closes #<!-- numéro de l'issue -->
Fixes #<!-- numéro de l'issue -->
Related to #<!-- numéro de l'issue -->

## 🚀 Changements apportés

<!-- Listez les principaux changements -->

-
-
-

## 📸 Screenshots / Démos

<!-- Si applicable, ajoutez des screenshots ou des GIFs -->

## ✅ Checklist

<!-- Vérifiez tous les points avant de soumettre la PR -->

### Tests

- [ ] J'ai ajouté des tests qui prouvent que ma correction fonctionne ou que ma fonctionnalité fonctionne
- [ ] Les tests unitaires passent localement (`npm test`)
- [ ] Les tests d'intégration passent localement
- [ ] J'ai vérifié la couverture de code (`npm run test:coverage`)

### Code Quality

- [ ] Mon code suit les conventions de style du projet
- [ ] J'ai effectué une auto-revue de mon code
- [ ] J'ai commenté mon code, particulièrement dans les zones complexes
- [ ] Le linting passe sans erreurs (`npm run lint`)
- [ ] Le formatage est correct (`npm run format`)
- [ ] J'ai vérifié qu'il n'y a pas de console.log ou de code de debug

### Documentation

- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] J'ai mis à jour le README.md si nécessaire
- [ ] J'ai ajouté/mis à jour les commentaires JSDoc
- [ ] J'ai mis à jour le CHANGELOG.md

### Build & Deploy

- [ ] Le build TypeScript fonctionne (`npm run build`)
- [ ] L'application démarre correctement (`npm start`)
- [ ] Le Dockerfile build correctement
- [ ] Docker Compose fonctionne (`docker-compose up`)

### Sécurité

- [ ] Je n'ai pas exposé de secrets ou de clés API
- [ ] J'ai vérifié les dépendances pour les vulnérabilités (`npm audit`)
- [ ] J'ai suivi les bonnes pratiques de sécurité
- [ ] Les données sensibles sont correctement chiffrées

### Base de données

- [ ] J'ai créé/mis à jour les migrations si nécessaire
- [ ] J'ai testé les migrations en local
- [ ] Les schémas Mongoose sont à jour
- [ ] Les index sont optimisés

## 🧪 Comment tester ?

<!-- Expliquez comment tester vos changements -->

1.
2.
3.

## 📊 Impact

<!-- Décrivez l'impact de cette PR -->

### Performance
- [ ] Cette PR améliore les performances
- [ ] Cette PR n'affecte pas les performances
- [ ] Cette PR pourrait affecter les performances (expliquez ci-dessous)

### Breaking Changes
- [ ] Cette PR contient des breaking changes (listez-les ci-dessous)
- [ ] Cette PR ne contient pas de breaking changes

### Migration nécessaire
- [ ] Cette PR nécessite une migration de base de données
- [ ] Cette PR nécessite une mise à jour de configuration
- [ ] Cette PR ne nécessite aucune migration

## 🔄 Environnements de test

<!-- Sur quels environnements avez-vous testé ? -->

- [ ] Local (développement)
- [ ] Docker (local)
- [ ] Staging
- [ ] Production (si applicable)

## 📝 Notes supplémentaires

<!-- Ajoutez toute information supplémentaire ici -->

## 👥 Reviewers

<!-- Mentionnez les personnes qui devraient review cette PR -->

@TheGoatIA

---

## 📋 Post-Merge Checklist

<!-- À vérifier après le merge -->

- [ ] Vérifier que le déploiement s'est bien passé
- [ ] Vérifier les logs pour les erreurs
- [ ] Vérifier les métriques de performance
- [ ] Notifier l'équipe des changements importants
- [ ] Mettre à jour le board de projet
- [ ] Fermer les issues liées
