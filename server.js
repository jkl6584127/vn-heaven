const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

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

function readSubmissions() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeSubmissions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const urlParts = req.url.split('?');
  let url = urlParts[0];
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // === API Routes ===

  // POST /api/submissions - create new submission
  if (url === '/api/submissions' && method === 'POST') {
    parseBody(req).then(body => {
      const { name, phone, line } = body;
      if (!name || !phone || !line) {
        return sendJSON(res, 400, { error: '所有欄位皆為必填' });
      }
      const submissions = readSubmissions();
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name,
        phone,
        line,
        createdAt: new Date().toISOString(),
        read: false,
      };
      submissions.unshift(entry);
      writeSubmissions(submissions);
      sendJSON(res, 201, { success: true, id: entry.id });
    }).catch(() => {
      sendJSON(res, 400, { error: '無效的請求格式' });
    });
    return;
  }

  // GET /api/submissions - list all submissions
  if (url === '/api/submissions' && method === 'GET') {
    const submissions = readSubmissions();
    sendJSON(res, 200, submissions);
    return;
  }

  // DELETE /api/submissions/:id
  if (url.startsWith('/api/submissions/') && method === 'DELETE') {
    const id = url.split('/api/submissions/')[1];
    let submissions = readSubmissions();
    const before = submissions.length;
    submissions = submissions.filter(s => s.id !== id);
    if (submissions.length === before) {
      return sendJSON(res, 404, { error: '找不到該筆資料' });
    }
    writeSubmissions(submissions);
    sendJSON(res, 200, { success: true });
    return;
  }

  // PATCH /api/submissions/:id/read - mark as read
  if (url.match(/^\/api\/submissions\/[^/]+\/read$/) && method === 'PATCH') {
    const id = url.split('/')[3];
    const submissions = readSubmissions();
    const entry = submissions.find(s => s.id === id);
    if (!entry) {
      return sendJSON(res, 404, { error: '找不到該筆資料' });
    }
    entry.read = true;
    writeSubmissions(submissions);
    sendJSON(res, 200, { success: true });
    return;
  }

  // PATCH /api/submissions/:id - update status / note
  if (url.match(/^\/api\/submissions\/[^/]+$/) && method === 'PATCH') {
    const id = url.split('/')[3];
    parseBody(req).then(body => {
      const submissions = readSubmissions();
      const entry = submissions.find(s => s.id === id);
      if (!entry) {
        return sendJSON(res, 404, { error: '找不到該筆資料' });
      }
      if (body.contactStatus !== undefined) entry.contactStatus = body.contactStatus;
      if (body.note !== undefined) entry.note = body.note;
      writeSubmissions(submissions);
      sendJSON(res, 200, { success: true });
    }).catch(() => {
      sendJSON(res, 400, { error: '無效的請求格式' });
    });
    return;
  }

  // === Static File Serving ===

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
