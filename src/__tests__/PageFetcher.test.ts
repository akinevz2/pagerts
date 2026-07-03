import { PageFetcher } from '../page/PageFetcher';

describe('PageFetcher', () => {
  let pageFetcher: PageFetcher;
  const originalFetch = global.fetch;
  const sampleHtml = '<html><head><title>Example</title></head><body></body></html>';

  const makeHtmlResponse = (): Response =>
    new Response(sampleHtml, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });

  beforeEach(() => {
    // Disable retries in unit tests to avoid pending backoff timers.
    pageFetcher = new PageFetcher(10000, 0);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('fetchAll', () => {
    it('should send an overridden user-agent when provided', async () => {
      const fetchMock = jest.fn().mockResolvedValue(makeHtmlResponse());
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
      const fetchMock = jest.fn().mockResolvedValue(makeHtmlResponse());
      global.fetch = fetchMock as typeof fetch;

      const urls = ['https://example.com'];
      const responses = await pageFetcher.fetchAll(urls);

      expect(responses.length).toBeGreaterThan(0);
      expect(responses[0].url).toBe('https://example.com');
    });

    it('should handle invalid URLs gracefully', async () => {
      const fetchMock = jest
        .fn()
        .mockRejectedValue(new Error('getaddrinfo ENOTFOUND test.invalid'));
      global.fetch = fetchMock as typeof fetch;

      const urls = ['https://this-domain-definitely-does-not-exist-12345.com'];
      const responses = await pageFetcher.fetchAll(urls);

      expect(responses.length).toBeGreaterThan(0);
      if (responses[0].error) {
        expect(responses[0].error).toContain('Failed to fetch');
      }
    });

    it('should handle multiple URLs', async () => {
      const fetchMock = jest.fn().mockImplementation(async (input: string | URL | Request) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes('example.org')) {
          return new Response('<html><head><title>Example Org</title></head><body></body></html>', {
            headers: { 'content-type': 'text/html; charset=utf-8' },
          });
        }
        return makeHtmlResponse();
      });
      global.fetch = fetchMock as typeof fetch;

      const urls = ['https://example.com', 'https://example.org'];
      const responses = await pageFetcher.fetchAll(urls);

      expect(responses.length).toBe(2);
    });

    it('should have timeout for slow requests', async () => {
      const timeoutError = new Error('The operation was aborted');
      Object.defineProperty(timeoutError, 'name', { value: 'AbortError' });
      const fetchMock = jest.fn().mockRejectedValue(timeoutError);
      global.fetch = fetchMock as typeof fetch;

      const slowFetcher = new PageFetcher(100, 0);
      const urls = ['https://httpbin.org/delay/5'];

      const responses = await slowFetcher.fetchAll(urls);
      expect(responses.length).toBeGreaterThan(0);

      if (responses[0].error) {
        expect(responses[0].error).toContain('timeout');
      }
    }, 10000);

    it('should surface HTTP status failures', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }));
      global.fetch = fetchMock as typeof fetch;

      const responses = await pageFetcher.fetchAll(['https://example.com/missing']);

      expect(responses).toHaveLength(1);
      expect(responses[0].error).toContain('HTTP 404');
    });

    it('should reject non-HTML content types', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(
          new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } })
        );
      global.fetch = fetchMock as typeof fetch;

      const responses = await pageFetcher.fetchAll(['https://example.com/api']);

      expect(responses).toHaveLength(1);
      expect(responses[0].error).toContain('Unsupported content type');
    });

    it('should reject responses that exceed max allowed size', async () => {
      const oversizedBody = 'x'.repeat(2 * 1024 * 1024 + 1);
      const fetchMock = jest.fn().mockResolvedValue(
        new Response(oversizedBody, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'content-length': String(oversizedBody.length),
          },
        })
      );
      global.fetch = fetchMock as typeof fetch;

      const responses = await pageFetcher.fetchAll(['https://example.com/large']);

      expect(responses).toHaveLength(1);
      expect(responses[0].error).toContain('max allowed size');
    });
  });
});
