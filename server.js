const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - Page Not Found</h1><p><a href="/platform/">Back to Home</a></p>');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];

  // Root → redirect to /platform/
  if (url === '/') {
    res.writeHead(301, { 'Location': '/platform/' });
    res.end();
    return;
  }

  // Directory URLs → append index.html
  if (url.endsWith('/')) url += 'index.html';

  // Try the exact path first
  const exactPath = path.join(__dirname, url);
  fs.access(exactPath, fs.constants.F_OK, (err) => {
    if (!err) {
      serveFile(res, exactPath);
    } else {
      // If not found and no extension, try as directory
      if (!path.extname(url)) {
        const dirIndex = path.join(__dirname, url, 'index.html');
        serveFile(res, dirIndex);
      } else {
        serveFile(res, exactPath); // Will 404
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`VN Heaven server running on port ${PORT}`);
});
