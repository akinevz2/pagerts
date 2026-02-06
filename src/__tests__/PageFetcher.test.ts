import { PageFetcher } from '../page/PageFetcher';

describe('PageFetcher', () => {
  let pageFetcher: PageFetcher;

  beforeEach(() => {
    pageFetcher = new PageFetcher();
  });

  describe('fetchAll', () => {
    it('should fetch valid URLs', async () => {
      const urls = ['https://example.com'];
      const responses = await pageFetcher.fetchAll(urls);

      expect(responses.length).toBeGreaterThan(0);
      expect(responses[0].url).toBe('https://example.com');
    });

    it('should handle invalid URLs gracefully', async () => {
      const urls = ['https://this-domain-definitely-does-not-exist-12345.com'];
      const responses = await pageFetcher.fetchAll(urls);

      expect(responses.length).toBeGreaterThan(0);
      if (responses[0].error) {
        expect(responses[0].error).toContain('Failed to fetch');
      }
    });

    it('should handle multiple URLs', async () => {
      const urls = ['https://example.com', 'https://example.org'];
      const responses = await pageFetcher.fetchAll(urls);

      expect(responses.length).toBe(2);
    });

    it('should have timeout for slow requests', async () => {
      const slowFetcher = new PageFetcher(100, 0); // 100ms timeout, no retries
      const urls = ['https://httpbin.org/delay/5']; // This will timeout

      const responses = await slowFetcher.fetchAll(urls);
      expect(responses.length).toBeGreaterThan(0);

      if (responses[0].error) {
        expect(responses[0].error).toContain('timeout');
      }
    }, 10000);
  });
});
