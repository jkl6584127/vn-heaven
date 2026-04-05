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

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];

  // Root → redirect to /platform/ so relative paths work
  if (url === '/') {
    res.writeHead(302, { 'Location': '/platform/' });
    res.end();
    return;
  }

  // Landing page
  if (url === '/landing' || url === '/landing/') url = '/landing/index.html';

  // If path has no extension and doesn't end with /, try adding /index.html
  if (!path.extname(url) && !url.endsWith('/')) {
    url = url + '/index.html';
  }
  if (url.endsWith('/')) {
    url = url + 'index.html';
  }

  const filePath = path.join(__dirname, url);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - Page Not Found</h1><p><a href="/platform/">Back to Home</a></p>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`VN Heaven server running on port ${PORT}`);
});
