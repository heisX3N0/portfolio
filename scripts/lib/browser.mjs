// Headless Chrome for the layout checks, with no extra dependency: a static server for dist/
// (gzip on text, like Cloudflare) and the DevTools protocol over Node's built-in WebSocket.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
};
const TEXT = new Set(['.html', '.css', '.js', '.svg', '.xml']);

/** `pageHeaders` go on HTML responses only, as Cloudflare's _headers would add them (the CSP check). */
export function serve(distDir, pageHeaders = {}) {
  const server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\//, '');
    if (path === '' || path.endsWith('/')) path += 'index.html';
    const file = join(distDir, path);
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    const ext = extname(file);
    let body = readFileSync(file);
    const headers = { 'Content-Type': TYPES[ext] ?? 'application/octet-stream', ...(ext === '.html' ? pageHeaders : {}) };
    if (TEXT.has(ext)) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
    }
    res.writeHead(200, headers).end(body);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

export function findChrome() {
  return CANDIDATES.find((p) => p && existsSync(p));
}

async function waitFor(fn, ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const value = fn();
    if (value) return value;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('timed out waiting for Chrome');
}

export async function launch() {
  const executable = findChrome();
  if (!executable) throw new Error('No Chrome or Edge found: set CHROME_PATH');
  const profile = mkdtempSync(join(tmpdir(), 'portfolio-chrome-'));
  const args = ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'];
  if (process.platform === 'linux') args.unshift('--no-sandbox');
  const proc = spawn(executable, args, { stdio: 'ignore' });
  let ws;
  try {
    const portFile = join(profile, 'DevToolsActivePort');
    const port = await waitFor(() => existsSync(portFile) && readFileSync(portFile, 'utf8').split('\n')[0]);
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
    const page = targets.find((t) => t.type === 'page');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
  } catch (error) {
    // A Chrome that never opened its debugging port would otherwise keep the test run alive.
    proc.kill();
    throw error;
  }

  let id = 0;
  const pending = new Map();
  const waiters = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const w of waiters.filter((w) => w.method === msg.method)) {
        waiters.splice(waiters.indexOf(w), 1);
        w.resolve(msg.params);
      }
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));

  await send('Page.enable');
  await send('Runtime.enable');
  // Every load is a first visit: a cache hit reports transferSize 0, which would hide bytes from the page weight check.
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  // Test visits must never count as traffic: the analytics script still loads (and is checked against the CSP),
  // but its report to Cloudflare is blocked.
  await send('Network.setBlockedURLs', { urls: ['*cloudflareinsights.com/cdn-cgi/rum*'] });

  async function evaluate(expression) {
    const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  }

  return {
    evaluate,
    /** Load a URL at a viewport size, with an optional colour scheme, and wait for fonts. */
    async open(url, { width, height, scheme = 'light' }) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
      const loaded = once('Page.loadEventFired');
      await send('Page.navigate', { url });
      await loaded;
      await evaluate('document.fonts.ready.then(() => true)');
    },
    /** Run a script in every page loaded from now on, before the page's own scripts (and outside its CSP). */
    async beforeEachLoad(source) {
      await send('Page.addScriptToEvaluateOnNewDocument', { source });
    },
    async close() {
      ws.close();
      proc.kill();
      await new Promise((r) => setTimeout(r, 300));
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        // Chrome may still hold the profile on Windows; the OS temp cleaner removes it
      }
    },
  };
}
