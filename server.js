const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const resolveFilePath = (requestPath) => {
  const decodedPath = decodeURIComponent(requestPath.split('?')[0]);
  const normalizedPath = path.normalize(decodedPath).replace(/^([.][.][/\\])+/, '');
  const relativePath = normalizedPath === '/' ? '/index.html' : normalizedPath;
  const candidates = [
    path.join(PUBLIC_DIR, relativePath),
    path.join(ROOT_DIR, relativePath)
  ];

  for (const candidate of candidates) {
    try {
      const stats = fs.statSync(candidate);
      if (stats.isFile()) {
        return candidate;
      }
      if (stats.isDirectory()) {
        const indexPath = path.join(candidate, 'index.html');
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return null;
};

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  let filePath;
  try {
    filePath = resolveFilePath(req.url);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
    return;
  }

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.createReadStream(filePath)
    .on('error', () => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    })
    .pipe(res.writeHead(200, { 'Content-Type': contentType }));
});

server.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});
