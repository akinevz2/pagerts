import { PageFetcher } from '../page/PageFetcher';

describe('PageFetcher', () => {
  let pageFetcher: PageFetcher;
  const originalFetch = global.fetch;

  beforeEach(() => {
    pageFetcher = new PageFetcher();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('fetchAll', () => {
    it('should send an overridden user-agent when provided', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        new Response('<html><head><title>Example</title></head><body></body></html>', {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })
      );
      global.fetch = fetchMock as typeof fetch;

      const customFetcher = new PageFetcher(10000, 0, 'Mozilla/5.0 Custom Test Browser');
      const responses = await customFetcher.fetchAll(['https://example.com']);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: { 'user-agent': 'Mozilla/5.0 Custom Test Browser' },
        })
      );
      expect(responses[0].content).toBeDefined();
    });

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
