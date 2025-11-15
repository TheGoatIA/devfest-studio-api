# 🧪 Guide de Tests - DevFest Studio API

Ce document décrit la stratégie de tests, comment exécuter les tests, et les bonnes pratiques.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Configuration](#configuration)
- [Exécution des tests](#exécution-des-tests)
- [Types de tests](#types-de-tests)
- [Écriture de tests](#écriture-de-tests)
- [Couverture de code](#couverture-de-code)
- [CI/CD](#cicd)

## Vue d'ensemble

Le projet utilise **Jest** comme framework de tests avec :

- **Tests unitaires** : Testent les composants isolés
- **Tests d'intégration** : Testent les interactions entre composants
- **TypeScript support** : Via ts-jest
- **Mocks** : Pour isoler les dépendances
- **Coverage** : Suivi de la couverture de code

## Configuration

### Installation des dépendances

```bash
npm install
```

### Configuration Jest

La configuration se trouve dans `jest.config.js` :

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
};
```

## Exécution des tests

### Tous les tests

```bash
npm test
```

### Tests en mode watch

```bash
npm run test:watch
```

### Tests avec couverture

```bash
npm run test:coverage
```

### Tests spécifiques

```bash
# Un fichier spécifique
npm test LocalStorageService.test.ts

# Un pattern
npm test -- --testPathPattern=services

# Une suite spécifique
npm test -- --testNamePattern="uploadFile"
```

### Tests en CI

```bash
# Désactiver le watch mode en CI
CI=true npm test
```

## Types de tests

### Tests unitaires

Testent des fonctions et classes isolées.

**Emplacement** : `tests/unit/`

**Exemple** : `tests/unit/services/LocalStorageService.test.ts`

```typescript
import { LocalStorageService } from '../../../src/application/services/LocalStorageService';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    service = new LocalStorageService();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const fileBuffer = Buffer.from('test data');
      const metadata = {
        type: 'photo',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        userId: 'user123',
      };

      const result = await service.uploadFile(fileBuffer, metadata);

      expect(result).toHaveProperty('publicUrl');
      expect(result.size).toBe(fileBuffer.length);
    });
  });
});
```

### Tests d'intégration

Testent les interactions entre composants.

**Emplacement** : `tests/integration/`

**Exemple** : `tests/integration/api/photos.test.ts`

```typescript
import request from 'supertest';
import { Express } from 'express';

describe('Photos API', () => {
  let app: Express;

  beforeAll(async () => {
    // Setup test app
    app = await createTestApp();
  });

  describe('POST /api/v1/photos', () => {
    it('should upload a photo', async () => {
      const response = await request(app)
        .post('/api/v1/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', 'test/fixtures/photo.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('photoId');
    });
  });
});
```

## Écriture de tests

### Structure d'un test

```typescript
describe('NomDuComposant', () => {
  // Setup
  beforeEach(() => {
    // Préparation avant chaque test
  });

  afterEach(() => {
    // Nettoyage après chaque test
  });

  describe('nomDeLaMethode', () => {
    it('should faire quelque chose de spécifique', () => {
      // Arrange (Préparer)
      const input = 'test';

      // Act (Agir)
      const result = functionToTest(input);

      // Assert (Vérifier)
      expect(result).toBe('expected');
    });

    it('should gérer les erreurs', () => {
      expect(() => functionToTest(null)).toThrow();
    });
  });
});
```

### Mocking

#### Mock de modules

```typescript
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

mockedAxios.get.mockResolvedValue({ data: 'mocked data' });
```

#### Mock de services

```typescript
const mockPhotoRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  // ...
};

mockPhotoRepository.create.mockResolvedValue(mockPhoto);
```

#### Mock de fs/promises

```typescript
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

mockFs.writeFile.mockResolvedValue(undefined);
```

### Assertions communes

```typescript
// Égalité
expect(value).toBe(expected);
expect(object).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();

// Nombres
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThanOrEqual(5);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty('key');
expect(object).toMatchObject({ key: 'value' });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

### Bonnes pratiques

#### 1. Tests isolés

Chaque test doit être indépendant :

```typescript
// ❌ Mauvais - dépend d'un état partagé
let sharedState;

it('test 1', () => {
  sharedState = 'value';
});

it('test 2', () => {
  expect(sharedState).toBe('value'); // Peut échouer si test 1 n'a pas run
});

// ✅ Bon - chaque test est indépendant
it('test 1', () => {
  const localState = 'value';
  expect(localState).toBe('value');
});

it('test 2', () => {
  const localState = 'value';
  expect(localState).toBe('value');
});
```

#### 2. Tests clairs et descriptifs

```typescript
// ❌ Mauvais
it('works', () => {
  // ...
});

// ✅ Bon
it('should return user data when valid ID is provided', () => {
  // ...
});
```

#### 3. AAA Pattern (Arrange, Act, Assert)

```typescript
it('should calculate total price correctly', () => {
  // Arrange - Préparer les données
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 },
  ];

  // Act - Exécuter la fonction
  const total = calculateTotal(items);

  // Assert - Vérifier le résultat
  expect(total).toBe(35);
});
```

#### 4. Un seul concept par test

```typescript
// ❌ Mauvais - teste plusieurs choses
it('should create and delete user', () => {
  const user = createUser();
  expect(user).toBeDefined();

  deleteUser(user.id);
  expect(findUser(user.id)).toBeNull();
});

// ✅ Bon - un concept par test
it('should create user', () => {
  const user = createUser();
  expect(user).toBeDefined();
});

it('should delete user', () => {
  const user = createUser();
  deleteUser(user.id);
  expect(findUser(user.id)).toBeNull();
});
```

#### 5. Tests de cas limites

```typescript
describe('divide', () => {
  it('should divide two numbers', () => {
    expect(divide(6, 2)).toBe(3);
  });

  it('should handle division by zero', () => {
    expect(() => divide(5, 0)).toThrow('Division by zero');
  });

  it('should handle negative numbers', () => {
    expect(divide(-6, 2)).toBe(-3);
  });

  it('should handle decimals', () => {
    expect(divide(5, 2)).toBe(2.5);
  });
});
```

## Couverture de code

### Générer le rapport

```bash
npm run test:coverage
```

### Visualiser le rapport

```bash
# Ouvrir coverage/lcov-report/index.html dans le navigateur
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

### Objectifs de couverture

Le projet vise :

- **Statements** : 80%+
- **Branches** : 80%+
- **Functions** : 80%+
- **Lines** : 80%+

### Exclure des fichiers

Dans `jest.config.js` :

```javascript
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.d.ts',
  '!src/**/*.interface.ts',
  '!src/index.ts',
  '!src/**/__tests__/**',
],
```

## CI/CD

### GitHub Actions

Les tests s'exécutent automatiquement sur :

- Push sur `main`, `develop`, `dev`
- Pull requests
- Workflow dispatch manuel

Voir `.github/workflows/ci.yml` :

```yaml
test-unit:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
    - run: npm ci
    - run: npm test -- --coverage
    - uses: codecov/codecov-action@v4
```

### Badges

Ajoutez des badges dans le README :

```markdown
![Tests](https://github.com/TheGoatIA/devfest-studio-api/workflows/CI/badge.svg)
![Coverage](https://codecov.io/gh/TheGoatIA/devfest-studio-api/branch/main/graph/badge.svg)
```

## Debugging des tests

### Mode verbose

```bash
npm test -- --verbose
```

### Exécuter un seul test

```bash
it.only('should run only this test', () => {
  // ...
});
```

### Ignorer un test

```bash
it.skip('should skip this test', () => {
  // ...
});
```

### Debug avec Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Puis ouvrez Chrome à `chrome://inspect`

### Logs dans les tests

```typescript
it('should debug something', () => {
  console.log('Debug info:', someValue);
  expect(someValue).toBe(expected);
});
```

## Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing TypeScript](https://jestjs.io/docs/getting-started#using-typescript)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## Support

Pour toute question sur les tests :

- 📖 Documentation : [README.md](README.md)
- 🐛 Issues : [GitHub Issues](https://github.com/TheGoatIA/devfest-studio-api/issues)
- 💬 Discussions : [GitHub Discussions](https://github.com/TheGoatIA/devfest-studio-api/discussions)
