import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { run } from '../bin/main.js';

function captureStdout(t) {
  let output = '';
  t.mock.method(process.stdout, 'write', (chunk) => {
    output += String(chunk);
    return true;
  });
  return () => JSON.parse(output);
}

test('fetches and extracts page resources with JSON output', async (t) => {
  const requestedUrls = [];
  t.mock.method(JSDOM, 'fromURL', async (url) => {
    requestedUrls.push(url);
    return new JSDOM(
      '<title>Mock page</title><a href="https://example.test/docs">Documentation</a><a href="mailto:hello@example.test">Email</a>',
      { url }
    );
  });
  const getOutput = captureStdout(t);

  await run(['https://example.test/']);

  assert.deepEqual(requestedUrls, ['https://example.test/']);
  assert.deepEqual(getOutput(), [
    {
      title: 'Mock page',
      url: 'https://example.test/',
      resources: [
        {
          tag: 'a',
          key: 'textContent',
          value: 'Documentation',
          link: { key: 'href', url: 'https://example.test/docs' },
        },
      ],
    },
  ]);
});

test('loads file URLs through jsdom and returns an empty resources list', async (t) => {
  const fileUrls = [];
  t.mock.method(JSDOM, 'fromFile', async (url) => {
    fileUrls.push(url);
    return new JSDOM('<title>Local page</title>', { url });
  });
  const getOutput = captureStdout(t);

  await run(['file:///tmp/pagerts-fixture.html']);

  assert.deepEqual(fileUrls, ['file:///tmp/pagerts-fixture.html']);
  assert.deepEqual(getOutput(), [
    {
      title: 'Local page',
      url: 'file:///tmp/pagerts-fixture.html',
      resources: [],
    },
  ]);
});
