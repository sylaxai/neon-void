import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), 'game');
const portIndex = process.argv.indexOf('--port');
const port = portIndex < 0 ? 8080 : Number(process.argv[portIndex + 1]);
const mime: Record<string, string> = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
createServer(async (req, res) => {
 try {
  const path = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
  let file = resolve(root, '.' + path);
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
  if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
  file = await realpath(file);
  if (!file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
  const body = await readFile(file);
  res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
  res.end(body);
 } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`NEON VOID: http://localhost:${port}`));
