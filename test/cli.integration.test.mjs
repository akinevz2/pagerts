import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { printDryRun, run, runAll } from '../bin/main.js';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

  await run(['https://example.test/'], undefined, true);

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
  t.mock.method(JSDOM, 'fromFile', async (path) => {
    fileUrls.push(path);
    return new JSDOM('<title>Local page</title>', { url: 'file://' + path });
  });
  const getOutput = captureStdout(t);

  await run(['file:///tmp/pagerts-fixture.html'], undefined, true);

  assert.deepEqual(fileUrls, ['/tmp/pagerts-fixture.html']);
  assert.deepEqual(getOutput(), [
    {
      title: 'Local page',
      url: 'file:///tmp/pagerts-fixture.html',
      resources: [],
    },
  ]);
});

test('loads regular file paths through jsdom and returns resources', async (t) => {
  const filePaths = [];
  t.mock.method(JSDOM, 'fromFile', async (path) => {
    filePaths.push(path);
    return new JSDOM(
      '<title>Local Relative Page</title><a href="https://example.test/local">Local link</a>',
      { url: 'file://' + path }
    );
  });
  const getOutput = captureStdout(t);

  await run(['./index.html'], undefined, true);

  assert.equal(filePaths.length, 1);
  assert.ok(filePaths[0].endsWith('index.html'));
  assert.deepEqual(getOutput(), [
    {
      title: 'Local Relative Page',
      url: 'file://' + filePaths[0],
      resources: [
        {
          tag: 'a',
          key: 'textContent',
          value: 'Local link',
          link: { key: 'href', url: 'https://example.test/local' },
        },
      ],
    },
  ]);
});

test('all scans nested elements and finds a custom link property', async (t) => {
  const getOutput = captureStdout(t);
  t.mock.method(JSDOM, 'fromURL', async (url) =>
    new JSDOM(
      '<title>All scan</title><section><div data-href="https://example.test/custom">Nested</div></section>',
      { url }
    )
  );

  await runAll(['https://example.test/'], [], true, ['data-href']);

  assert.deepEqual(getOutput(), [
    {
      title: 'All scan',
      url: 'https://example.test/',
      resources: [
        {
          tag: 'div',
          key: 'textContent',
          value: 'Nested',
          link: { key: 'data-href', url: 'https://example.test/custom' },
        },
      ],
    },
  ]);
});

test('all subcommand honors Commander option signals', async () => {
  const output = spawnSync(
    process.execPath,
    [
      new URL('../bin/main.js', import.meta.url).pathname,
      'all',
      '--dry-run',
      '--json',
      '-p',
      'data-href',
      'https://example.test/',
    ],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8' }
  );
  assert.equal(output.status, 0);
  assert.deepEqual(JSON.parse(output.stdout), {
    urls: ['https://example.test/'],
    tags: ['*'],
    properties: ['href', 'action', 'src', 'data-href'],
  });
});

test('dry run reports urls, selected tags, and link properties without fetching', async (t) => {
  let output = '';
  t.mock.method(process.stdout, 'write', (chunk) => {
    output += String(chunk);
    return true;
  });

  printDryRun(
    ['https://example.test/', './local.html'],
    ['a', 'img'],
    ['href', 'action', 'src', 'data-link'],
    true
  );

  assert.deepEqual(JSON.parse(output), {
    urls: ['https://example.test/', './local.html'],
    tags: ['a', 'img'],
    properties: ['href', 'action', 'src', 'data-link'],
  });
});
