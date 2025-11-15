import { WebhookService } from '../../../src/application/services/WebhookService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhookService', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    jest.clearAllMocks();
    webhookService = new WebhookService();
  });

  afterEach(() => {
    webhookService.removeAllListeners();
  });

  describe('Event Emission', () => {
    it('should emit events correctly', (done) => {
      const testData = { foo: 'bar' };

      webhookService.on('test.event', (event) => {
        expect(event.event).toBe('test.event');
        expect(event.data).toEqual(testData);
        expect(event.timestamp).toBeDefined();
        done();
      });

      webhookService.emitWebhook('test.event', testData);
    });

    it('should emit wildcard events', (done) => {
      const testData = { test: 'data' };

      webhookService.on('*', (event) => {
        expect(event.event).toBe('custom.event');
        expect(event.data).toEqual(testData);
        done();
      });

      webhookService.emitWebhook('custom.event', testData);
    });

    it('should include userId in event', (done) => {
      const userId = 'user123';
      const testData = { message: 'test' };

      webhookService.on('user.event', (event) => {
        expect(event.userId).toBe(userId);
        done();
      });

      webhookService.emitWebhook('user.event', testData, userId);
    });
  });

  describe('Photo Events', () => {
    it('should emit photo.uploaded event', (done) => {
      const photoId = 'photo123';
      const userId = 'user123';
      const photoUrl = 'http://example.com/photo.jpg';

      webhookService.on('photo.uploaded', (event) => {
        expect(event.event).toBe('photo.uploaded');
        expect(event.data.photoId).toBe(photoId);
        expect(event.data.userId).toBe(userId);
        expect(event.data.photoUrl).toBe(photoUrl);
        done();
      });

      webhookService.photoUploaded(photoId, userId, photoUrl);
    });

    it('should emit photo.deleted event', (done) => {
      const photoId = 'photo123';
      const userId = 'user123';

      webhookService.on('photo.deleted', (event) => {
        expect(event.event).toBe('photo.deleted');
        expect(event.data.photoId).toBe(photoId);
        expect(event.data.userId).toBe(userId);
        done();
      });

      webhookService.photoDeleted(photoId, userId);
    });
  });

  describe('Transformation Events', () => {
    it('should emit transformation.started event', (done) => {
      const transformationId = 'trans123';
      const userId = 'user123';
      const photoId = 'photo123';
      const styleId = 'style123';

      webhookService.on('transformation.started', (event) => {
        expect(event.event).toBe('transformation.started');
        expect(event.data.transformationId).toBe(transformationId);
        expect(event.data.userId).toBe(userId);
        expect(event.data.photoId).toBe(photoId);
        expect(event.data.styleId).toBe(styleId);
        done();
      });

      webhookService.transformationStarted(transformationId, userId, photoId, styleId);
    });

    it('should emit transformation.completed event', (done) => {
      const transformationId = 'trans123';
      const userId = 'user123';
      const photoId = 'photo123';
      const styleId = 'style123';
      const resultUrl = 'http://example.com/result.jpg';

      webhookService.on('transformation.completed', (event) => {
        expect(event.event).toBe('transformation.completed');
        expect(event.data.transformationId).toBe(transformationId);
        expect(event.data.resultUrl).toBe(resultUrl);
        done();
      });

      webhookService.transformationCompleted(transformationId, userId, photoId, styleId, resultUrl);
    });

    it('should emit transformation.failed event', (done) => {
      const transformationId = 'trans123';
      const userId = 'user123';
      const error = 'Processing failed';

      webhookService.on('transformation.failed', (event) => {
        expect(event.event).toBe('transformation.failed');
        expect(event.data.transformationId).toBe(transformationId);
        expect(event.data.error).toBe(error);
        done();
      });

      webhookService.transformationFailed(transformationId, userId, error);
    });
  });

  describe('HTTP Webhook Delivery', () => {
    it('should send HTTP webhook with correct payload', async () => {
      const webhookUrl = 'https://example.com/webhook';
      mockedAxios.post.mockResolvedValue({ status: 200, data: 'OK' });

      webhookService.registerWebhook(webhookUrl, 'test-secret');

      await webhookService.emitWebhook('test.event', { data: 'test' });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockedAxios.post).toHaveBeenCalled();
      const call = mockedAxios.post.mock.calls[0];
      expect(call[0]).toBe(webhookUrl);
      expect(call[1]).toHaveProperty('event');
      expect(call[1]).toHaveProperty('data');
      expect(call[2]?.headers).toHaveProperty('X-Webhook-Signature');
    });

    it('should retry failed webhook deliveries', async () => {
      const webhookUrl = 'https://example.com/webhook';
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ status: 200, data: 'OK' });

      webhookService.registerWebhook(webhookUrl, 'test-secret');

      await webhookService.emitWebhook('test.event', { data: 'test' });

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Should have been called 3 times (1 initial + 2 retries)
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should give up after max retries', async () => {
      const webhookUrl = 'https://example.com/webhook';
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      webhookService.registerWebhook(webhookUrl, 'test-secret');

      await webhookService.emitWebhook('test.event', { data: 'test' });

      // Wait for all retries
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Should have been called max retry times
      expect(mockedAxios.post.mock.calls.length).toBeLessThanOrEqual(4);
    }, 15000);
  });

  describe('Webhook Registration', () => {
    it('should register webhook successfully', () => {
      const webhookUrl = 'https://example.com/webhook';
      const secret = 'test-secret';

      expect(() => {
        webhookService.registerWebhook(webhookUrl, secret);
      }).not.toThrow();
    });

    it('should unregister webhook successfully', () => {
      const webhookUrl = 'https://example.com/webhook';

      webhookService.registerWebhook(webhookUrl, 'secret');

      expect(() => {
        webhookService.unregisterWebhook(webhookUrl);
      }).not.toThrow();
    });
  });

  describe('HMAC Signature', () => {
    it('should generate HMAC signature for webhooks', async () => {
      const webhookUrl = 'https://example.com/webhook';
      const secret = 'test-secret';
      mockedAxios.post.mockResolvedValue({ status: 200, data: 'OK' });

      webhookService.registerWebhook(webhookUrl, secret);

      await webhookService.emitWebhook('test.event', { data: 'test' });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockedAxios.post).toHaveBeenCalled();
      const headers = mockedAxios.post.mock.calls[0][2]?.headers;
      expect(headers).toHaveProperty('X-Webhook-Signature');
      expect(headers!['X-Webhook-Signature']).toMatch(/^sha256=/);
    });
  });
});
