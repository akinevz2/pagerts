import { PageFetcher } from '../page/PageFetcher';

describe('PageFetcher security', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('blocks redirects to private hosts by default', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/internal' },
      })
    ) as typeof fetch;

    const fetcher = new PageFetcher(1000, 0);
    const responses = await fetcher.fetchAll(['https://example.com/start']);

    expect(responses).toHaveLength(1);
    expect(responses[0]?.error).toContain('Blocked unsafe redirect target');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('allows redirects to private hosts when explicitly enabled', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: 'http://127.0.0.1/internal' },
        })
      )
      .mockResolvedValueOnce(
        new Response('<html><head><title>ok</title></head><body></body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })
      ) as typeof fetch;

    const fetcher = new PageFetcher(1000, 0, undefined, true);
    const responses = await fetcher.fetchAll(['https://example.com/start']);

    expect(responses).toHaveLength(1);
    expect(responses[0]?.content).toBeDefined();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('fails when streamed response exceeds max size without content-length', async () => {
    const oversizedBody = new ReadableStream<Uint8Array>({
      start(controller): void {
        controller.enqueue(new Uint8Array(1024 * 1024));
        controller.enqueue(new Uint8Array(1024 * 1024));
        controller.enqueue(new Uint8Array(1));
        controller.close();
      },
    });

    global.fetch = jest.fn().mockResolvedValue(
      new Response(oversizedBody, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    ) as typeof fetch;

    const fetcher = new PageFetcher(1000, 0);
    const responses = await fetcher.fetchAll(['https://example.com/large']);

    expect(responses).toHaveLength(1);
    expect(responses[0]?.error).toContain('Response exceeds max allowed size');
  });
});
