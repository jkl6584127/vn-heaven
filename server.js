const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');

// ===== Auth =====
const ADMIN_USER = 'haha080808';
const ADMIN_PASS_HASH = crypto.createHash('sha256').update('080808').digest('hex');
const sessions = new Map(); // token -> { createdAt }

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

function isValidSession(token) {
  if (!token || !sessions.has(token)) return false;
  const session = sessions.get(token);
  // 24-hour expiry
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireAuth(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return false;
  return isValidSession(auth.slice(7));
}

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // === Auth API ===

  // POST /api/auth/login
  if (url === '/api/auth/login' && method === 'POST') {
    parseBody(req).then(body => {
      const { username, password } = body;
      const passHash = crypto.createHash('sha256').update(password || '').digest('hex');
      if (username === ADMIN_USER && passHash === ADMIN_PASS_HASH) {
        const token = createSession();
        sendJSON(res, 200, { success: true, token });
      } else {
        sendJSON(res, 401, { error: '帳號或密碼錯誤' });
      }
    }).catch(() => {
      sendJSON(res, 400, { error: '無效的請求格式' });
    });
    return;
  }

  // POST /api/auth/verify
  if (url === '/api/auth/verify' && method === 'POST') {
    sendJSON(res, 200, { valid: requireAuth(req) });
    return;
  }

  // POST /api/auth/logout
  if (url === '/api/auth/logout' && method === 'POST') {
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      sessions.delete(auth.slice(7));
    }
    sendJSON(res, 200, { success: true });
    return;
  }

  // === API Routes ===

  // POST /api/submissions - create new submission (public, no auth)
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

  // GET /api/submissions - list all submissions (auth required)
  if (url === '/api/submissions' && method === 'GET') {
    if (!requireAuth(req)) return sendJSON(res, 401, { error: '請先登入' });
    const submissions = readSubmissions();
    sendJSON(res, 200, submissions);
    return;
  }

  // DELETE /api/submissions/:id (auth required)
  if (url.startsWith('/api/submissions/') && method === 'DELETE') {
    if (!requireAuth(req)) return sendJSON(res, 401, { error: '請先登入' });
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

  // PATCH /api/submissions/:id/read - mark as read (auth required)
  if (url.match(/^\/api\/submissions\/[^/]+\/read$/) && method === 'PATCH') {
    if (!requireAuth(req)) return sendJSON(res, 401, { error: '請先登入' });
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

  // PATCH /api/submissions/:id - update status / note (auth required)
  if (url.match(/^\/api\/submissions\/[^/]+$/) && method === 'PATCH') {
    if (!requireAuth(req)) return sendJSON(res, 401, { error: '請先登入' });
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
