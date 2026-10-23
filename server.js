require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { body, param, validationResult } = require('express-validator');
const validator = require('validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const util = require('util');
const { execSync } = require('child_process');
const sharp = require('sharp');
const { registerPrintableCardRoutes } = require('./lib/printable-card/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Short code configuration
const SHORT_CODE_LENGTH = 7;
const SHORT_CODE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Logging configuration
const MAX_LOG_LINES = 1000;
const logFile = path.join(__dirname, 'server.log');
let logLines = [];

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data, null, 2) : ''}`;
  if (NODE_ENV === 'development') console.log(logEntry);
  logLines.push(logEntry);
  if (logLines.length > MAX_LOG_LINES) logLines = logLines.slice(-MAX_LOG_LINES);
  fs.promises.appendFile(logFile, logEntry + '\n', 'utf8').catch(() => {});
}

app.set('trust proxy', 1);

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:8095'];
const NODE_ENV = process.env.NODE_ENV || 'development';

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@localhost';
const APP_URL = process.env.APP_URL || (() => {
  if (NODE_ENV === 'production') {
    console.error('ERROR: APP_URL must be set in production environment');
    process.exit(1);
  }
  return 'http://localhost:3000';
})();

// Demo Mode configuration
const IS_DEMO_MODE = process.env.DEMO_MODE === 'true';
let DEMO_USER_ID = null;

if (IS_DEMO_MODE) {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🚀 [DEMO MODE ENABLED] ');
  console.log('Company: Demon Straight - Making Things Straight Since 1994');
  console.log('Admin Account: alex@demonstraight.com / demo123');
  console.log('Reset Interval: Every 60 minutes');
  console.log('════════════════════════════════════════════════════════════════\n');
}

// Create email transporter
let emailTransporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
  emailTransporter = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  });
} else if (NODE_ENV === 'development') {
  emailTransporter = {
    sendMail: async (options) => {
      console.log('=== EMAIL (Development Mode) ===');
      console.log('To:', options.to, 'Subject:', options.subject);
      return { messageId: 'dev-' + Date.now() };
    }
  };
} else {
  console.warn('WARNING: SMTP not configured. Email features will not work.');
}

// --- 1. SETUP DIRECTORIES ---
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function validateFilePath(filePath) {
  if (!filePath) throw new Error('File path is required');
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadsDir = path.resolve(UPLOADS_DIR);
  if (!resolvedPath.startsWith(resolvedUploadsDir)) throw new Error('Invalid file path: path traversal detected');
  return resolvedPath;
}

// --- 1.5 PREVIEW IMAGE CACHE SETUP ---
const PREVIEW_CACHE_DIR = path.join(__dirname, 'cache', 'previews');
const PREVIEW_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
const PREVIEW_CACHE_MAX_SIZE_MB = 100;

if (!fs.existsSync(PREVIEW_CACHE_DIR)) {
  fs.mkdirSync(PREVIEW_CACHE_DIR, { recursive: true });
  log('[Cache] Created preview cache directory');
}

async function cleanOldCacheFiles() {
  try {
    const files = await fs.promises.readdir(PREVIEW_CACHE_DIR);
    let cleaned = 0;
    for (const file of files) {
      const filePath = path.join(PREVIEW_CACHE_DIR, file);
      const stat = await fs.promises.stat(filePath);
      if (Date.now() - stat.mtimeMs > PREVIEW_CACHE_MAX_AGE) {
        await fs.promises.unlink(filePath);
        cleaned++;
      }
    }
    if (cleaned > 0) log(`[Cache] Cleaned ${cleaned} expired cache files`);
  } catch (err) { log('[Cache] Error cleaning old cache files:', err.message); }
}
cleanOldCacheFiles();

async function enforceCacheSizeLimit() {
  try {
    const files = await fs.promises.readdir(PREVIEW_CACHE_DIR);
    let totalSize = 0;
    const fileStats = [];
    for (const file of files) {
      const filePath = path.join(PREVIEW_CACHE_DIR, file);
      const stat = await fs.promises.stat(filePath);
      totalSize += stat.size;
      fileStats.push({ file, filePath, mtime: stat.mtimeMs, size: stat.size });
    }
    const maxSizeBytes = PREVIEW_CACHE_MAX_SIZE_MB * 1024 * 1024;
    if (totalSize > maxSizeBytes) {
      fileStats.sort((a, b) => a.mtime - b.mtime);
      for (const f of fileStats) {
        await fs.promises.unlink(f.filePath);
        totalSize -= f.size;
        if (totalSize <= maxSizeBytes * 0.9) break;
      }
      log(`[Cache] Enforced size limit. Current size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    }
  } catch (err) { log('[Cache] Error enforcing size limit:', err.message); }
}
setInterval(enforceCacheSizeLimit, 60 * 60 * 1000);

async function writeToCacheAtomic(filename, buffer) {
  const tempPath = path.join(PREVIEW_CACHE_DIR, `${filename}.${Date.now()}.tmp`);
  const finalPath = path.join(PREVIEW_CACHE_DIR, filename);
  try {
    await fs.promises.writeFile(tempPath, buffer);
    await fs.promises.rename(tempPath, finalPath);
  } catch (err) {
    try { await fs.promises.unlink(tempPath); } catch (e) {}
    console.error('[Cache] Atomic write failed:', err.message);
  }
}

function resolveCachePath(identifier) {
  if (!identifier || !/^[a-zA-Z0-9-]+$/.test(identifier)) return null;
  const filename = `preview_${identifier}.png`;
  const resolvedPath = path.resolve(PREVIEW_CACHE_DIR, filename);
  const resolvedCacheDir = path.resolve(PREVIEW_CACHE_DIR);
  if (!resolvedPath.startsWith(resolvedCacheDir)) return null;
  return resolvedPath;
}

async function invalidatePreviewCache(slug, shortCode) {
  const toDelete = [];
  if (slug) {
    const slugPath = resolveCachePath(slug);
    if (slugPath) toDelete.push(slugPath);
  }
  if (shortCode) {
    const shortCodePath = resolveCachePath(shortCode);
    if (shortCodePath) toDelete.push(shortCodePath);
  }
  for (const filePath of toDelete) {
    try {
      await fs.promises.unlink(filePath);
      console.log('[Cache] Invalidated:', path.basename(filePath));
    } catch (err) {
      if (err.code !== 'ENOENT') console.error('[Cache] Invalidation error:', err.message);
    }
  }
}

// --- 2. SETUP DATABASE (SQLite) ---
const DB_FILENAME = IS_DEMO_MODE ? 'cards-demo.db' : 'cards.db';
const db = new sqlite3.Database(path.join(DATA_DIR, DB_FILENAME));

db.run("PRAGMA foreign_keys = ON", (err) => {
  if (err) { console.error('CRITICAL: Failed to enable foreign keys:', err); process.exit(1); }
  console.log('[DB] Foreign key constraints enabled');
});

console.log(`[DB] Using ${IS_DEMO_MODE ? 'demo' : 'normal'} database: ${DB_FILENAME}`);

const dbRun = util.promisify(db.run.bind(db));
const dbGet = util.promisify(db.get.bind(db));

async function logAudit(eventType, entityType, entityId, entityData, performedBy, organisationId) {
  const auditId = require('crypto').randomUUID();
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO audit_log (id, event_type, entity_type, entity_id, entity_data, performed_by, organisation_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [auditId, eventType, entityType, entityId, JSON.stringify(entityData), performedBy, organisationId],
      (err) => err ? reject(err) : resolve(auditId)
    );
  });
}

const getThemeColorHex = (colorName) => {
  if (!colorName || typeof colorName !== 'string') return '#4f46e5';
  const normalizedColorName = colorName.toLowerCase().trim();
  const colorMap = {
    indigo: '#4f46e5', blue: '#2563eb', rose: '#e11d48', emerald: '#059669', slate: '#475569',
    purple: '#7c3aed', cyan: '#0891b2', teal: '#0d9488', orange: '#ea580c', pink: '#db2777',
    violet: '#7c3aed', fuchsia: '#c026d3', amber: '#d97706', lime: '#65a30d', green: '#16a34a',
    yellow: '#ca8a04', red: '#dc2626'
  };
  return colorMap[normalizedColorName] || '#4f46e5';
};

const getDefaultThemeColors = () => [
  { name: "indigo", colorType: "standard", baseColor: "indigo", hexBase: "#4f46e5", hexSecondary: "#7c3aed", gradientStyle: "linear-gradient(135deg, #4f46e5, #7c3aed)", buttonStyle: "#4f46e5", linkStyle: "#4f46e5", textStyle: "#4f46e5" },
  { name: "blue", colorType: "standard", baseColor: "blue", hexBase: "#2563eb", hexSecondary: "#0891b2", gradientStyle: "linear-gradient(135deg, #2563eb, #0891b2)", buttonStyle: "#2563eb", linkStyle: "#2563eb", textStyle: "#2563eb" },
  { name: "rose", colorType: "standard", baseColor: "rose", hexBase: "#e11d48", hexSecondary: "#ea580c", gradientStyle: "linear-gradient(135deg, #e11d48, #ea580c)", buttonStyle: "#e11d48", linkStyle: "#e11d48", textStyle: "#e11d48" },
  { name: "emerald", colorType: "standard", baseColor: "emerald", hexBase: "#059669", hexSecondary: "#0d9488", gradientStyle: "linear-gradient(135deg, #059669, #0d9488)", buttonStyle: "#059669", linkStyle: "#059669", textStyle: "#059669" },
  { name: "slate", colorType: "standard", baseColor: "slate", hexBase: "#475569", hexSecondary: "#475569", gradientStyle: "linear-gradient(135deg, #475569, #475569)", buttonStyle: "#475569", linkStyle: "#475569", textStyle: "#475569" }
];

function backfillShortCodes() {
  db.all("SELECT slug, user_id FROM cards WHERE short_code IS NULL OR short_code = ''", [], (err, rows) => {
    if (err || !rows?.length) return;
    log(`Found ${rows.length} cards without short codes, generating...`);
    let processed = 0;
    rows.forEach(row => {
      ensureUniqueShortCode(db, (err, shortCode) => {
        if (err) return console.error('Error generating short code:', err);
        db.run("UPDATE cards SET short_code = ? WHERE slug = ? AND user_id = ?", [shortCode, row.slug, row.user_id], (err) => {
          if (err) console.error('Error updating card with short code:', err);
          else if (++processed === rows.length) log(`Successfully backfilled ${processed} cards with short codes`);
        });
      });
    });
  });
}

// --- 3. SETUP UPLOADS (Multer) ---
const { randomUUID } = require('crypto');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
const LINK_ICON_MAX_DIMENSION = 256;

function sanitizeUploadUrl(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('/uploads/')) return '';
  const filename = trimmed.slice('/uploads/'.length);
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) return '';
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return '';
  return `/uploads/${filename}`.slice(0, 500);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) return cb(new Error('Invalid file type'));
    cb(null, randomUUID() + ext);
  }
});

const upload = multer({
  storage, limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) return cb(new Error('Invalid file extension'));
    cb(null, true);
  }
});

// --- MIDDLEWARE ---
app.use((req, res, next) => {
  res.locals.nonce = require('crypto').randomBytes(16).toString('base64');
  next();
});

const cspDirectives = {
  defaultSrc: ["'self'"], imgSrc: ["'self'", "data:", "https:"], styleSrc: ["'self'", "'unsafe-inline'"],
  fontSrc: ["'self'", "data:"],
  connectSrc: NODE_ENV === 'development' ? ["'self'", "http://127.0.0.1:7243", "http://localhost:7243", "https://api.github.com"] : ["'self'", "https://api.github.com"]
};

app.use((req, res, next) => {
  helmet({
    contentSecurityPolicy: { useDefaults: false, directives: { ...cspDirectives, scriptSrc: ["'self'", `'nonce-${res.locals.nonce}'`] } },
    crossOriginEmbedderPolicy: false
  })(req, res, next);
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin && NODE_ENV === 'development') return callback(null, true);
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true, methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many login attempts, please try again later.', standardHeaders: true, legacyHeaders: false });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many upload attempts, please try again later.', standardHeaders: true, legacyHeaders: false });
const publicReadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: 'Too many requests from this IP, please try again later.', standardHeaders: true, legacyHeaders: false });
const cardReadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests from this IP, please try again later.', standardHeaders: true, legacyHeaders: false });

const csrfProtection = csrf({ cookie: { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict' } });

if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'https' || req.secure) return next();
    if (process.env.FORCE_HTTPS === 'true') return res.redirect(301, `https://${req.headers.host}${req.url}`);
    next();
  });
}

app.use(express.static(path.join(__dirname, 'build'), { maxAge: '1d', etag: true, lastModified: true, index: false }));
app.use('/uploads', express.static(UPLOADS_DIR));

// --- AUTHENTICATION MIDDLEWARE ---
const requireAuth = (req, res, next) => {
  if (IS_DEMO_MODE && DEMO_USER_ID) {
    db.get('SELECT id, role, organisation_id FROM users WHERE id = ?', [DEMO_USER_ID], (err, row) => {
      if (err || !row) return res.status(401).json({ error: 'Demo user not found' });
      req.user = { id: row.id, organisationId: row.organisation_id, role: row.role };
      next();
    });
    return;
  }
  const token = req.cookies.authToken || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.user_id) {
      req.user = { id: decoded.user_id, organisationId: decoded.organisation_id || null, role: decoded.role || 'member' };
    } else if (decoded.admin) {
      req.user = { id: null, organisationId: null, role: 'admin' };
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    next();
  };
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  if (NODE_ENV === 'production') {
    if (err.name === 'ValidationError') return res.status(400).json({ error: 'Invalid input' });
    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Unauthorized' });
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error', stack: err.stack });
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    let errorMessage = firstError.msg;
    if (firstError.param === 'password' && firstError.msg.includes('length')) errorMessage = 'Password must be at least 8 characters long';
    else if (firstError.param === 'email') errorMessage = 'Please enter a valid email address';
    else if (firstError.param === 'role') errorMessage = 'Role must be either "owner" or "member"';
    return res.status(400).json({ error: errorMessage, details: NODE_ENV === 'development' ? errors.array() : undefined });
  }
  next();
};

// --- PHASE 2: SECURE IMAGE GENERATION MODULE ---
const escapeXml = (str) => {
  if (!str) return '';
  return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
};

async function fetchAvatarImage(avatarUrl) {
  try {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('/uploads/')) {
      const filename = path.basename(avatarUrl);
      const safePath = path.resolve(UPLOADS_DIR, filename);
      if (!safePath.startsWith(path.resolve(UPLOADS_DIR))) return null;
      return await fs.promises.readFile(safePath);
    }
    if (avatarUrl.startsWith('/demo/')) {
      const filename = path.basename(avatarUrl);
      const safePath = path.resolve(__dirname, 'public', 'demo', filename);
      if (!safePath.startsWith(path.resolve(__dirname, 'public', 'demo'))) return null;
      return await fs.promises.readFile(safePath);
    }
    return null;
  } catch (err) { console.error('[Preview] Error fetching avatar:', err.message); return null; }
}

async function generateGenericPreviewImage() {
  const width = 1200, height = 630;
  try {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6"/>
      <rect width="${width}" height="${height}" fill="url(#grad)" opacity="0.1"/>
      <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1"/><stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1"/></linearGradient></defs>
      <text x="600" y="315" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#6b7280">Card Preview</text>
      <text x="600" y="370" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#9ca3af">This card is private</text>
    </svg>`;
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch (err) { console.error('[Preview] Error generating generic preview:', err.message); return null; }
}

async function generatePreviewImage(cardData, themeColor) {
  try {
    const firstName = cardData.personal?.firstName || '';
    const lastName = cardData.personal?.lastName || '';
    const title = cardData.personal?.title || '';
    const avatarUrl = cardData.images?.avatar || '';
    const escapedName = escapeXml(`${firstName} ${lastName}`.trim());
    const escapedTitle = escapeXml(title);
    const escapedCompany = escapeXml(cardData.personal?.company || '');
    const colorHex = getThemeColorHex(themeColor);
    const width = 1200, height = 630;
    
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${colorHex};stop-opacity:1"/><stop offset="100%" style="stop-color:${colorHex};stop-opacity:0.7"/></linearGradient></defs>
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      <rect x="0" y="0" width="400" height="${height}" fill="url(#grad)"/>
      <text x="500" y="260" font-family="Atkinson Hyperlegible" font-size="56" font-weight="bold" fill="#3d3d3d">${escapedName}</text>
      <text x="500" y="330" font-family="Atkinson Hyperlegible" font-size="28" fill="#6b7280">${escapedTitle}</text>
      <rect x="500" y="358" width="100" height="6" fill="${colorHex}"/>
      <text x="500" y="408" font-family="Atkinson Hyperlegible" font-size="28" fill="#6b7280">${escapedCompany}</text>
    </svg>`;
    
    let image = await sharp(Buffer.from(svg)).png().toBuffer();
    let imageSharp = sharp(image);
    
    if (avatarUrl) {
      try {
        const avatarBuffer = await fetchAvatarImage(avatarUrl);
        if (avatarBuffer) {
          const avatarSize = 250;
          const avatarLeft = Math.round((400 - avatarSize) / 2);
          const avatarTop = Math.round((height - avatarSize) / 2);
          const circleMaskSvg = `<svg width="${avatarSize}" height="${avatarSize}" xmlns="http://www.w3.org/2000/svg"><defs><mask id="circleMask"><rect width="${avatarSize}" height="${avatarSize}" fill="black"/><circle cx="${avatarSize/2}" cy="${avatarSize/2}" r="${avatarSize/2}" fill="white"/></mask></defs><rect width="${avatarSize}" height="${avatarSize}" mask="url(#circleMask)" fill="white"/></svg>`;
          const resizedAvatar = await sharp(avatarBuffer).resize(avatarSize, avatarSize, { fit: 'cover' }).composite([{ input: Buffer.from(circleMaskSvg), blend: 'dest-in' }]).png().toBuffer();
          imageSharp = imageSharp.composite([{ input: resizedAvatar, left: avatarLeft, top: avatarTop }]);
        }
      } catch (err) { console.warn('[Preview] Could not composite avatar:', err.message); }
    }
    return await imageSharp.png().toBuffer();
  } catch (err) { console.error('[Preview] Error generating preview image:', err.message); return null; }
}

// --- PRINTABLE CARDS ROUTES (PROTECTED BY AUTH) ---
// NOTE: This MUST be placed AFTER requireAuth definition
const printableRoutes = require('./server/routes/printable')(db);
app.use('/api/printable', requireAuth, apiLimiter, csrfProtection, printableRoutes);

registerPrintableCardRoutes(app, {
  db,
  requireAuth,
  csrfProtection,
  apiLimiter,
  handleValidationErrors,
  APP_URL,
  UPLOADS_DIR
});

// --- API ROUTES ---
app.get('/api/csrf-token', csrfProtection, (req, res) => res.json({ csrfToken: req.csrfToken() }));

app.get('/api/setup/status', apiLimiter, (req, res, next) => {
  if (IS_DEMO_MODE) return res.json({ setupComplete: true, userCount: 6, demoMode: true });
  db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
    if (err) return next(err);
    res.json({ setupComplete: row.count > 0, userCount: row.count, demoMode: false });
  });
});

app.get('/api/demo/status', apiLimiter, (req, res) => res.json({
  demoMode: IS_DEMO_MODE, resetInterval: 60,
  company: IS_DEMO_MODE ? 'Demon Straight' : null,
  credentials: IS_DEMO_MODE ? { email: 'alex@demonstraight.com', password: 'demo123' } : null
}));

app.post('/api/setup/initialize', apiLimiter, csrfProtection, [
  body('organisationName').trim().isLength({ min: 1, max: 200 }),
  body('adminEmail').isEmail({ allow_display_name: false, require_tld: false }),
  body('adminPassword').isLength({ min: 8 })
], handleValidationErrors, async (req, res, next) => {
  db.get("SELECT COUNT(*) as count FROM users", [], async (err, row) => {
    if (err) return next(err);
    if (row.count > 0) return res.status(403).json({ error: 'Setup already completed' });
    const { organisationName, adminEmail, adminPassword } = req.body;
    const orgSlug = organisationName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').replace(/-+$/, '') || 'organisation';
    
    const findAvailableSlug = (slug, counter = 0) => {
      const finalSlug = counter === 0 ? slug : `${orgSlug}-${counter}`;
      db.get("SELECT id FROM organisations WHERE slug = ?", [finalSlug], (err, existingOrg) => {
        if (err) return next(err);
        if (existingOrg) findAvailableSlug(slug, counter + 1);
        else createOrgAndUser(finalSlug);
      });
    };
    
    findAvailableSlug(orgSlug);
    
    async function createOrgAndUser(slug) {
      const orgId = require('crypto').randomUUID();
      const userId = require('crypto').randomUUID();
      try {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        db.run(`INSERT INTO organisations (id, name, slug, subscription_tier) VALUES (?, ?, ?, ?)`, [orgId, organisationName, slug, 'individual'], (err) => {
          if (err) return next(err);
          db.run(`INSERT INTO users (id, email, password_hash, organisation_id, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)`, [userId, adminEmail.toLowerCase(), passwordHash, orgId, 'owner', 0], async (err) => {
            if (err) return next(err);
            const defaultColors = getDefaultThemeColors();
            try {
              await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'default_organisation', organisationName]);
              await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'theme_colors', JSON.stringify(defaultColors)]);
              await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_theme_customisation', 'true']);
              await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_image_customisation', 'true']);
              await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_links_customisation', 'true']);
              await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_privacy_customisation', 'true']);
              await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_send_details_customisation', 'true']);
            } catch (err) { return next(err); }
            const token = jwt.sign({ user_id: userId, organisation_id: orgId, role: 'owner' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            res.cookie('authToken', token, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
            res.json({ success: true, userId, email: adminEmail.toLowerCase(), role: 'owner' });
          });
        });
      } catch (err) { return next(err); }
    }
  });
});

app.post('/api/login', loginLimiter, [
  body('email').custom((value) => {
    if (value && (validator.isEmail(value) || /^[^\s@]+@localhost(\.[^\s@]+)?$/.test(value))) return true;
    throw new Error('Valid email required');
  }),
  body('password').notEmpty()
], handleValidationErrors, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    db.get("SELECT id, email, password_hash, organisation_id, role FROM users WHERE email = ?", [email.toLowerCase()], async (err, user) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) return res.status(401).json({ error: 'Invalid email or password' });
      const token = jwt.sign({ user_id: user.id, organisation_id: user.organisation_id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      res.cookie('authToken', token, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
      res.json({ success: true });
    });
  } catch (err) { next(err); }
});

function slugifyOrgName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').replace(/-+$/, '') || 'organisation';
}

async function initializeOrgSettings(orgId, organisationName) {
  const defaultColors = getDefaultThemeColors();
  await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'default_organisation', organisationName]);
  await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'theme_colors', JSON.stringify(defaultColors)]);
  await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_theme_customisation', 'true']);
  await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_image_customisation', 'true']);
  await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_links_customisation', 'true']);
  await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_privacy_customisation', 'true']);
  await dbRun("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [orgId, 'allow_send_details_customisation', 'true']);
}

function issueAuthCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie('authToken', token, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
}

async function findAvailableOrgSlug(baseSlug) {
  let counter = 0;
  while (true) {
    const candidate = counter === 0 ? baseSlug : `${baseSlug}-${counter}`;
    const existing = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM organisations WHERE slug = ?", [candidate], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!existing) return candidate;
    counter += 1;
  }
}

app.post('/api/register', loginLimiter, [
  body('organisationName').trim().isLength({ min: 1, max: 200 }),
  body('email').isEmail({ allow_display_name: false, require_tld: false }),
  body('password').isLength({ min: 8 }).matches(/[A-Za-z]/).matches(/\d/),
  body('confirmPassword').custom((value, { req }) => { if (value !== req.body.password) throw new Error('Passwords do not match'); return true; })
], handleValidationErrors, async (req, res, next) => {
  if (IS_DEMO_MODE) return res.status(403).json({ error: 'Registration is disabled in demo mode' });
  const organisationName = req.body.organisationName.trim();
  const email = req.body.email.toLowerCase().trim();
  const { password } = req.body;
  try {
    const existingUser = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => err ? reject(err) : resolve(row));
    });
    if (existingUser) return res.status(409).json({ error: 'An account with this email already exists' });
    const slug = await findAvailableOrgSlug(slugifyOrgName(organisationName));
    const orgId = require('crypto').randomUUID();
    const userId = require('crypto').randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO organisations (id, name, slug, subscription_tier) VALUES (?, ?, ?, ?)`, [orgId, organisationName, slug, 'individual'], (err) => err ? reject(err) : resolve());
    });
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO users (id, email, password_hash, organisation_id, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)`, [userId, email, passwordHash, orgId, 'owner', 0], (err) => err ? reject(err) : resolve());
    });
    await initializeOrgSettings(orgId, organisationName);
    issueAuthCookie(res, { user_id: userId, organisation_id: orgId, role: 'owner' });
    res.status(201).json({ success: true, userId, email, role: 'owner' });
  } catch (err) { next(err); }
});

app.post('/api/logout', (req, res) => { res.clearCookie('authToken'); res.json({ success: true }); });

app.post('/api/upload', requireAuth, uploadLimiter, csrfProtection, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = req.file.path;
    const { fileTypeFromFile } = await import('file-type');
    const fileType = await fileTypeFromFile(filePath);
    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      try { await fs.promises.unlink(validateFilePath(filePath)); } catch (e) {}
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }
    const ext = path.extname(req.file.filename).toLowerCase();
    const expectedExt = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    if (expectedExt[fileType.mime] !== ext) {
      try { await fs.promises.unlink(validateFilePath(filePath)); } catch (e) {}
      return res.status(400).json({ error: 'File extension does not match file type' });
    }
    if (req.body.purpose === 'link-icon') {
      const metadata = await sharp(filePath).metadata();
      const isAnimatedGif = fileType.mime === 'image/gif' && (metadata.pages || 1) > 1;
      const exceedsLimit = metadata.width > LINK_ICON_MAX_DIMENSION || metadata.height > LINK_ICON_MAX_DIMENSION;
      if (isAnimatedGif || exceedsLimit) {
        const formatByMime = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
        const resized = await sharp(filePath).resize(LINK_ICON_MAX_DIMENSION, LINK_ICON_MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true }).toFormat(formatByMime[fileType.mime]).toBuffer();
        await fs.promises.writeFile(filePath, resized);
      }
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { await fs.promises.unlink(validateFilePath(req.file.path)); } catch (e) {}
    }
    next(err);
  }
});

app.get('/api/auth/me', requireAuth, apiLimiter, (req, res, next) => {
  if (!req.user.id) return res.status(401).json({ error: 'Unauthorized' });
  db.get(`SELECT u.id, u.email, u.organisation_id, u.role, u.email_verified, o.slug as org_slug FROM users u LEFT JOIN organisations o ON u.organisation_id = o.id WHERE u.id = ?`, [req.user.id], (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, organisationId: user.organisation_id, role: user.role, emailVerified: user.email_verified === 1, orgSlug: user.org_slug || null });
  });
});

const slugValidation = param('slug').trim().matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens').isLength({ min: 1, max: 50 });
const identifierValidation = param('slug').trim().matches(/^[a-zA-Z0-9-]+$/).withMessage('Identifier must contain only letters, numbers, and hyphens').isLength({ min: 1, max: 50 });

const crypto = require('crypto');
function generateShortCode() {
  let code = '';
  const charsLength = SHORT_CODE_CHARS.length;
  const maxValid = Math.floor(256 / charsLength) * charsLength;
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    let randomByte;
    do { randomByte = crypto.randomBytes(1)[0]; } while (randomByte >= maxValid);
    code += SHORT_CODE_CHARS[randomByte % charsLength];
  }
  return code;
}

function ensureUniqueShortCode(db, callback) {
  let attempts = 0;
  const tryGenerate = () => {
    const code = generateShortCode();
    db.get("SELECT 1 FROM cards WHERE short_code = ?", [code], (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(null, code);
      if (++attempts > 10) return callback(new Error('Failed to generate unique short code'));
      tryGenerate();
    });
  };
  tryGenerate();
}

const cardDataValidation = [
  body('personal.firstName').optional().trim().isLength({ max: 100 }),
  body('personal.lastName').optional().trim().isLength({ max: 100 }),
  body('personal.title').optional().trim().isLength({ max: 200 }),
  body('personal.company').optional().trim().isLength({ max: 200 }),
  body('personal.bio').optional().trim().isLength({ max: 1000 }),
  body('personal.location').optional().trim().isLength({ max: 200 }),
  body('contact.email').optional().trim().custom((value) => { if (value && !validator.isEmail(value)) throw new Error('Invalid email format'); return true; }),
  body('contact.phone').optional().trim().isLength({ max: 50 }),
  body('contact.website').optional().trim().custom((value) => { if (value && !validator.isURL(value, { protocols: ['http', 'https'] })) throw new Error('Invalid website URL'); return true; }),
  body('social.linkedin').optional().trim().custom((value) => { if (value && !validator.isURL(value, { protocols: ['http', 'https'] })) throw new Error('Invalid LinkedIn URL'); return true; }),
  body('social.twitter').optional().trim().custom((value) => { if (value && !validator.isURL(value, { protocols: ['http', 'https'] })) throw new Error('Invalid Twitter URL'); return true; }),
  body('social.instagram').optional().trim().custom((value) => { if (value && !validator.isURL(value, { protocols: ['http', 'https'] })) throw new Error('Invalid Instagram URL'); return true; }),
  body('social.github').optional().trim().custom((value) => { if (value && !validator.isURL(value, { protocols: ['http', 'https'] })) throw new Error('Invalid GitHub URL'); return true; }),
  body('links').optional().isArray(),
  body('links.*.title').optional().trim().isLength({ max: 200 }),
  body('links.*.url').optional().trim().custom((value) => { if (value && !validator.isURL(value, { protocols: ['http', 'https'] })) throw new Error('Invalid link URL'); return true; }),
  body('links.*.iconUrl').optional().trim().isLength({ max: 500 }),
  body('images.avatar').optional().trim().isLength({ max: 500 }),
  body('images.banner').optional().trim().isLength({ max: 500 }),
  body('privacy.requireInteraction').optional().isBoolean(),
  body('privacy.clientSideObfuscation').optional().isBoolean(),
  body('privacy.blockRobots').optional().isBoolean(),
  body('sendDetails.enabled').optional().isBoolean(),
  body('sendDetails.whatsapp').optional().isBoolean(),
  body('sendDetails.email').optional().isBoolean(),
  body('sendDetails.call').optional().isBoolean()
];

app.get('/api/admin/cards', requireAuth, apiLimiter, (req, res, next) => {
  if (!req.user.id) return res.status(401).json({ error: 'Unauthorized' });
  let query, params;
  const isOwner = req.user.role === 'owner';
  if (isOwner && req.user.organisationId) {
    db.get("SELECT slug, name FROM organisations WHERE id = ?", [req.user.organisationId], (err, orgRow) => {
      if (err) return next(err);
      let orgSlug = orgRow?.slug;
      if (!orgSlug && orgRow?.name) {
        const generatedSlug = orgRow.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').replace(/-+$/, '') || 'organization';
        db.run("UPDATE organisations SET slug = ? WHERE id = ?", [generatedSlug, req.user.organisationId], (err) => {
          if (err) return next(err);
          executeQuery(generatedSlug);
        });
      } else { executeQuery(orgSlug); }
      
      function executeQuery(orgSlugValue) {
        const query = `SELECT u.id as user_id, u.email as user_email, u.role as user_role, u.created_at as user_created_at, c.slug, c.short_code, c.data FROM users u LEFT JOIN cards c ON c.user_id = u.id WHERE u.organisation_id = ? ORDER BY u.created_at DESC, c.created_at DESC`;
        db.all(query, [req.user.organisationId], (err, rows) => {
          if (err) { log('GET /api/admin/cards - ERROR', { error: err.message, userId: req.user.id }); return next(err); }
          const list = rows.map(row => {
            const result = { userId: row.user_id, userEmail: row.user_email, userRole: row.user_role, userCreatedAt: row.user_created_at, slug: row.slug || null, shortCode: row.short_code || null, orgSlug: orgSlugValue || null, name: '', title: '', avatar: null, email: '' };
            if (row.slug && row.data) {
              try {
                const parsed = JSON.parse(row.data);
                result.name = `${parsed.personal?.firstName || ''} ${parsed.personal?.lastName || ''}`.trim();
                result.title = parsed.personal?.title || '';
                result.avatar = parsed.images?.avatar || null;
                result.email = (parsed.contact?.email || '').toLowerCase();
              } catch (e) { result.name = 'Invalid card data'; result.email = row.user_email; }
            } else { result.name = ''; result.email = row.user_email; }
            return result;
          });
          res.json(list);
        });
      }
    });
    return;
  } else if (isOwner) {
    query = `SELECT c.slug, c.short_code, c.data, c.user_id, u.email as user_email, u.role as user_role, u.created_at as user_created_at, o.slug as org_slug FROM cards c JOIN users u ON c.user_id = u.id LEFT JOIN organisations o ON u.organisation_id = o.id WHERE c.user_id = ? ORDER BY c.created_at DESC`;
    params = [req.user.id];
  } else {
    query = `SELECT c.slug, c.short_code, c.data, o.slug as org_slug FROM cards c JOIN users u ON c.user_id = u.id LEFT JOIN organisations o ON u.organisation_id = o.id WHERE c.user_id = ?`;
    params = [req.user.id];
  }
  db.all(query, params, (err, rows) => {
    if (err) { log('GET /api/admin/cards - ERROR', { error: err.message, userId: req.user.id }); return next(err); }
    const list = rows.map(row => {
      if (isOwner && req.user.organisationId) {
        const result = { userId: row.user_id, userEmail: row.user_email, userRole: row.user_role, userCreatedAt: row.user_created_at, slug: row.slug || null, shortCode: row.short_code || null, orgSlug: row.org_slug || null, name: '', title: '', avatar: null, email: '' };
        if (row.slug && row.data) {
          try {
            const parsed = JSON.parse(row.data);
            result.name = `${parsed.personal?.firstName || ''} ${parsed.personal?.lastName || ''}`.trim();
            result.title = parsed.personal?.title || '';
            result.avatar = parsed.images?.avatar || null;
            result.email = (parsed.contact?.email || '').toLowerCase();
          } catch (e) { result.name = 'Invalid card data'; result.email = row.user_email; }
        } else { result.name = ''; result.email = row.user_email; }
        return result;
      }
      try {
        const parsed = JSON.parse(row.data);
        const result = { slug: row.slug, shortCode: row.short_code || null, orgSlug: row.org_slug || null, name: `${parsed.personal?.firstName || ''} ${parsed.personal?.lastName || ''}`.trim(), title: parsed.personal?.title || '', avatar: parsed.images?.avatar || null, email: (parsed.contact?.email || '').toLowerCase() };
        if (isOwner && row.user_id) { result.userId = row.user_id; result.userEmail = row.user_email; result.userRole = row.user_role; result.userCreatedAt = row.user_created_at; result.orgSlug = row.org_slug || null; }
        return result;
      } catch (e) {
        const result = { slug: row.slug, shortCode: row.short_code || null, orgSlug: row.org_slug || null, name: 'Invalid data', title: '', avatar: null, email: '' };
        if (isOwner && row.user_id) { result.userId = row.user_id; result.userEmail = row.user_email; result.userRole = row.user_role; result.userCreatedAt = row.user_created_at; }
        return result;
      }
    });
    res.json(list);
  });
});

const shortCodeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many short code lookup attempts', standardHeaders: true, legacyHeaders: false });

app.get('/api/cards/short/:shortCode', cardReadLimiter, (req, res, next) => {
  const shortCode = (req.params.shortCode || '').trim();
  log(`[API] GET /api/cards/short/${shortCode} - Request received`);
  if (!shortCode || shortCode.length !== 7) return res.status(400).json({ error: `Short code must be exactly ${SHORT_CODE_LENGTH} characters` });
  if (!new RegExp(`^[a-zA-Z0-9]{${SHORT_CODE_LENGTH}}$`).test(shortCode)) return res.status(400).json({ error: 'Short code must contain only letters and numbers' });
  db.get(`SELECT c.data, c.short_code, o.slug as org_slug FROM cards c JOIN users u ON c.user_id = u.id LEFT JOIN organisations o ON u.organisation_id = o.id WHERE c.short_code = ?`, [shortCode], (err, row) => {
    if (err) { console.error('[API] Database error fetching short code:', err); return next(err); }
    if (!row) return res.status(404).json({ error: "Card not found" });
    try {
      const cardData = JSON.parse(row.data);
      cardData._shortCode = row.short_code;
      if (row.org_slug) cardData._orgSlug = row.org_slug;
      res.json(cardData);
    } catch (e) { console.error('[API] Error parsing card data:', e); next(e); }
  });
});

app.get('/api/cards/:identifier/preview.png', cardReadLimiter, [param('identifier').trim().matches(/^[a-zA-Z0-9-]+$/)], handleValidationErrors, async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    const identifierLower = identifier.toLowerCase();
    const cachedPath = resolveCachePath(identifierLower);
    if (cachedPath) {
      try {
        const stat = await fs.promises.stat(cachedPath);
        if (Date.now() - stat.mtimeMs < PREVIEW_CACHE_MAX_AGE) {
          const cachedBuffer = await fs.promises.readFile(cachedPath);
          res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=0, must-revalidate', 'ETag': `"${stat.mtime.getTime()}"`, 'Pragma': 'no-cache' });
          return res.send(cachedBuffer);
        }
      } catch (err) { if (err.code !== 'ENOENT') console.error('[Preview] Cache stat error:', err.message); }
    }
    let cardRow = await new Promise((resolve, reject) => {
      db.get(`SELECT c.data, c.short_code, c.slug, u.organisation_id FROM cards c JOIN users u ON c.user_id = u.id WHERE c.short_code = ?`, [identifier], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!cardRow) {
      cardRow = await new Promise((resolve, reject) => {
        db.get(`SELECT c.data, c.short_code, c.slug, u.organisation_id FROM cards c JOIN users u ON c.user_id = u.id WHERE LOWER(c.slug) = ? LIMIT 1`, [identifierLower], (err, row) => err ? reject(err) : resolve(row));
      });
    }
    if (!cardRow) return res.status(404).json({ error: 'Card not found' });
    let cardData;
    try { cardData = JSON.parse(cardRow.data); } catch (e) { return res.status(500).json({ error: 'Invalid card data' }); }
    const privacy = cardData.privacy || {};
    if (privacy.requireInteraction || privacy.clientSideObfuscation) {
      const genericImage = await generateGenericPreviewImage();
      if (!genericImage) return res.status(500).json({ error: 'Failed to generate preview' });
      res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=0, must-revalidate', 'Pragma': 'no-cache' });
      return res.send(genericImage);
    }
    const themeColor = cardData.theme?.color || 'indigo';
    const previewBuffer = await generatePreviewImage(cardData, themeColor);
    if (!previewBuffer) return res.status(500).json({ error: 'Failed to generate preview' });
    if (cachedPath) await writeToCacheAtomic(`preview_${identifier}.png`, previewBuffer);
    res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=0, must-revalidate', 'Pragma': 'no-cache' });
    res.send(previewBuffer);
  } catch (err) { console.error('[Preview] Endpoint error:', err.message); next(err); }
});

app.get('/api/cards/:orgSlug/:cardSlug', cardReadLimiter, [param('orgSlug').trim().matches(/^[a-z0-9-]+$/), param('cardSlug').trim().matches(/^[a-z0-9-]+$/)], handleValidationErrors, (req, res, next) => {
  const orgSlug = req.params.orgSlug.toLowerCase();
  const cardSlug = req.params.cardSlug.toLowerCase();
  db.get("SELECT id FROM organisations WHERE slug = ?", [orgSlug], (err, org) => {
    if (err) return next(err);
    if (!org) return res.status(404).json({ error: "Card not found" });
    db.get(`SELECT c.data, c.short_code FROM cards c JOIN users u ON c.user_id = u.id WHERE c.slug = ? AND u.organisation_id = ? LIMIT 1`, [cardSlug, org.id], (err, row) => {
      if (err) return next(err);
      if (!row) return res.status(404).json({ error: "Card not found" });
      try {
        const cardData = JSON.parse(row.data);
        cardData._shortCode = row.short_code;
        res.json(cardData);
      } catch (e) { next(e); }
    });
  });
});

app.get('/api/cards/:slug', cardReadLimiter, [slugValidation], handleValidationErrors, (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  db.get("SELECT data, short_code FROM cards WHERE slug = ? LIMIT 1", [slug], (err, row) => {
    if (err) return next(err);
    if (!row) return res.status(404).json({ error: "Card not found" });
    try {
      const cardData = JSON.parse(row.data);
      cardData._shortCode = row.short_code;
      res.setHeader('X-Deprecated', 'true');
      res.json(cardData);
    } catch (e) { next(e); }
  });
});

app.get('/api/admin/cards/:userId/:slug', apiLimiter, requireAuth, requireRole('owner'), [param('userId').isUUID(), slugValidation], handleValidationErrors, (req, res, next) => {
  const targetUserId = req.params.userId;
  const slug = req.params.slug.toLowerCase();
  db.get(`SELECT u.id FROM users u WHERE u.id = ? AND u.organisation_id = (SELECT organisation_id FROM users WHERE id = ?)`, [targetUserId, req.user.id], (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(404).json({ error: 'User not found in your organisation' });
    db.get("SELECT data, short_code FROM cards WHERE slug = ? AND user_id = ?", [slug, targetUserId], (err, row) => {
      if (err) return next(err);
      if (!row) return res.status(404).json({ error: 'Card not found' });
      try {
        const cardData = JSON.parse(row.data);
        cardData._shortCode = row.short_code;
        res.json(cardData);
      } catch (e) { next(e); }
    });
  });
});

app.post('/api/cards/:slug', requireAuth, apiLimiter, csrfProtection, [slugValidation, ...cardDataValidation], handleValidationErrors, (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  const sanitizedData = {
    personal: { firstName: (req.body.personal?.firstName || '').trim().substring(0, 100), lastName: (req.body.personal?.lastName || '').trim().substring(0, 100), title: (req.body.personal?.title || '').trim().substring(0, 200), company: (req.body.personal?.company || '').trim().substring(0, 200), bio: (req.body.personal?.bio || '').trim().substring(0, 1000), location: (req.body.personal?.location || '').trim().substring(0, 200) },
    contact: { email: (req.body.contact?.email || '').trim(), phone: (req.body.contact?.phone || '').trim().substring(0, 50), website: (req.body.contact?.website || '').trim() },
    social: { linkedin: (req.body.social?.linkedin || '').trim(), twitter: (req.body.social?.twitter || '').trim(), instagram: (req.body.social?.instagram || '').trim(), github: (req.body.social?.github || '').trim() },
    theme: req.body.theme || { color: 'indigo', style: 'modern' },
    images: { avatar: (req.body.images?.avatar || '').trim().substring(0, 500), banner: (req.body.images?.banner || '').trim().substring(0, 500) },
    links: (req.body.links || []).map(link => ({ id: link.id || Date.now(), title: (link.title || '').trim().substring(0, 200), url: (link.url || '').trim(), icon: link.icon || 'link', iconUrl: sanitizeUploadUrl(link.iconUrl) })).filter(link => link.url && validator.isURL(link.url, { protocols: ['http', 'https'] })),
    privacy: { requireInteraction: typeof req.body.privacy?.requireInteraction === 'boolean' ? req.body.privacy.requireInteraction : true, clientSideObfuscation: typeof req.body.privacy?.clientSideObfuscation === 'boolean' ? req.body.privacy.clientSideObfuscation : false, blockRobots: typeof req.body.privacy?.blockRobots === 'boolean' ? req.body.privacy.blockRobots : false },
    sendDetails: { enabled: typeof req.body.sendDetails?.enabled === 'boolean' ? req.body.sendDetails.enabled : true, whatsapp: typeof req.body.sendDetails?.whatsapp === 'boolean' ? req.body.sendDetails.whatsapp : true, email: typeof req.body.sendDetails?.email === 'boolean' ? req.body.sendDetails.email : true, call: typeof req.body.sendDetails?.call === 'boolean' ? req.body.sendDetails.call : true }
  };
  const DEFAULT_PRIVACY = { requireInteraction: true, clientSideObfuscation: false, blockRobots: false };
  const DEFAULT_SEND_DETAILS = { enabled: true, whatsapp: true, email: true, call: true };
  if (!req.user.id || !req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  
  let targetUserId = req.user.id;
  const proceedWithCardSave = (finalTargetUserId) => {
    getOrganizationSettings(req.user.organisationId, (err, orgSettings) => {
      if (err) return next(err);
      if (orgSettings.default_organisation) sanitizedData.personal.company = orgSettings.default_organisation;
      if (!orgSettings.allow_theme_customisation) {
        const requestedColor = sanitizedData.theme?.color;
        const allowedColors = orgSettings.theme_colors || [];
        const colorExists = allowedColors.some(c => c.name === requestedColor);
        if (!colorExists && requestedColor) sanitizedData.theme.color = allowedColors.length > 0 ? allowedColors[0].name : 'indigo';
      }
      if (!orgSettings.allow_image_customisation) {
        sanitizedData.images.avatar = ''; sanitizedData.images.banner = '';
        sanitizedData.links = sanitizedData.links.map(link => ({ ...link, iconUrl: '' }));
      }
      if (!orgSettings.allow_links_customisation) sanitizedData.links = [];
      const privacyLocked = !orgSettings.allow_privacy_customisation;
      const sendDetailsLocked = !orgSettings.allow_send_details_customisation;
      
      const saveCard = (existingData) => {
        if (privacyLocked) sanitizedData.privacy = existingData?.privacy || DEFAULT_PRIVACY;
        if (sendDetailsLocked) sanitizedData.sendDetails = existingData?.sendDetails || DEFAULT_SEND_DETAILS;
        db.get("SELECT short_code FROM cards WHERE slug = ? AND user_id = ?", [slug, finalTargetUserId], (err, existingCardWithCode) => {
          if (err) return next(err);
          const existingShortCode = existingCardWithCode?.short_code;
          if (existingShortCode) {
            const jsonContent = JSON.stringify(sanitizedData);
            db.run(`UPDATE cards SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ? AND user_id = ?`, [jsonContent, slug, finalTargetUserId], async function(err) {
              if (err) return next(err);
              await invalidatePreviewCache(slug, existingShortCode);
              res.json({ success: true, slug, shortCode: existingShortCode });
            });
          } else {
            ensureUniqueShortCode(db, (err, shortCode) => {
              if (err) return next(err);
              const jsonContent = JSON.stringify(sanitizedData);
              db.run(`INSERT INTO cards (slug, user_id, short_code, data, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(slug, user_id) DO UPDATE SET data = excluded.data, short_code = COALESCE(cards.short_code, excluded.short_code), updated_at = CURRENT_TIMESTAMP`, [slug, finalTargetUserId, shortCode, jsonContent], async function(err) {
                if (err) return next(err);
                await invalidatePreviewCache(slug, shortCode);
                res.json({ success: true, slug, shortCode });
              });
            });
          }
        });
      };
      
      if (privacyLocked || sendDetailsLocked) {
        db.get("SELECT data FROM cards WHERE slug = ? AND user_id = ?", [slug, finalTargetUserId], (err, existingCard) => {
          if (err) return next(err);
          let existingData = null;
          if (existingCard) { try { existingData = JSON.parse(existingCard.data); } catch (e) {} }
          saveCard(existingData);
        });
      } else { saveCard(null); }
    });
  };
  
  if (req.body.userId && req.user.role === 'owner') {
    db.get("SELECT id, organisation_id FROM users WHERE id = ?", [req.body.userId], (err, targetUser) => {
      if (err) return next(err);
      if (!targetUser) return res.status(404).json({ error: 'Target user not found' });
      if (targetUser.organisation_id !== req.user.organisationId) return res.status(403).json({ error: 'Cannot create card for user outside your organization' });
      proceedWithCardSave(req.body.userId);
    });
  } else { proceedWithCardSave(req.user.id); }
});

app.delete('/api/cards/:slug', requireAuth, apiLimiter, csrfProtection, [slugValidation], handleValidationErrors, async (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  if (!req.user.id) return res.status(401).json({ error: 'Unauthorized' });
  const requestedUserId = req.query.userId || null;
  const isOwnerDeletingForUser = req.user.role === 'owner' && requestedUserId && requestedUserId !== req.user.id;
  const performDelete = (targetUserId) => {
    db.get("SELECT short_code FROM cards WHERE slug = ? AND user_id = ?", [slug, targetUserId], (err, card) => {
      if (err) return next(err);
      if (!card) return res.status(404).json({ error: 'Card not found' });
      const shortCode = card.short_code;
      db.run("DELETE FROM cards WHERE slug = ? AND user_id = ?", [slug, targetUserId], async function(err) {
        if (err) return next(err);
        if (this.changes === 0) return res.status(404).json({ error: 'Card not found' });
        await invalidatePreviewCache(slug, shortCode);
        res.json({ success: true });
      });
    });
  };
  if (isOwnerDeletingForUser) {
    db.get("SELECT id FROM users WHERE id = ? AND organisation_id = (SELECT organisation_id FROM users WHERE id = ?)", [requestedUserId, req.user.id], (err, user) => {
      if (err) return next(err);
      if (!user) return res.status(404).json({ error: 'User not found in your organisation' });
      performDelete(requestedUserId);
    });
  } else { performDelete(req.user.id); }
});

const getOrganizationSettings = (organisationId, callback) => {
  db.all("SELECT key, value FROM organisation_settings WHERE organisation_id = ?", [organisationId], (err, rows) => {
    if (err) return callback(err, null);
    const settings = {};
    rows.forEach(row => {
      try {
        if (row.key === 'theme_colors') settings[row.key] = JSON.parse(row.value);
        else if (row.key.startsWith('allow_')) settings[row.key] = row.value === 'true';
        else settings[row.key] = row.value;
      } catch (e) { console.error(`Error parsing setting ${row.key}:`, e); }
    });
    if (!settings.default_organisation) settings.default_organisation = 'My Organisation';
    if (!settings.theme_colors || !Array.isArray(settings.theme_colors)) settings.theme_colors = getDefaultThemeColors();
    if (!settings.theme_variant) settings.theme_variant = 'swiish';
    if (settings.allow_theme_customisation === undefined) settings.allow_theme_customisation = true;
    if (settings.allow_image_customisation === undefined) settings.allow_image_customisation = true;
    if (settings.allow_links_customisation === undefined) settings.allow_links_customisation = true;
    if (settings.allow_privacy_customisation === undefined) settings.allow_privacy_customisation = true;
    if (settings.allow_send_details_customisation === undefined) settings.allow_send_details_customisation = true;
    callback(null, settings);
  });
};

app.get('/api/settings', apiLimiter, (req, res, next) => {
  const orgSlug = req.query.orgSlug || 'default';
  db.all(`SELECT os.key, os.value FROM organisation_settings os JOIN organisations o ON os.organisation_id = o.id WHERE o.slug = ? AND os.key IN ('theme_colors', 'theme_variant', 'default_organisation')`, [orgSlug], (err, rows) => {
    if (err) return next(err);
    const settings = {};
    rows.forEach(row => {
      try {
        if (row.key === 'theme_colors') settings.theme_colors = JSON.parse(row.value);
        else if (row.key === 'theme_variant') settings.theme_variant = row.value;
        else if (row.key === 'default_organisation') settings.default_organisation = row.value;
      } catch (e) { console.error(`Error parsing setting ${row.key}:`, e); }
    });
    if (!settings.theme_colors || !Array.isArray(settings.theme_colors)) settings.theme_colors = getDefaultThemeColors();
    if (!settings.theme_variant) settings.theme_variant = 'swiish';
    if (!settings.default_organisation) settings.default_organisation = 'My Organisation';
    res.json(settings);
  });
});

app.get('/api/admin/settings', requireAuth, requireRole('owner'), apiLimiter, (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  db.all("SELECT key, value FROM organisation_settings WHERE organisation_id = ?", [req.user.organisationId], (err, rows) => {
    if (err) { log('GET /api/admin/settings - Database error', { error: err.message }); return next(err); }
    const settings = {};
    rows.forEach(row => {
      try {
        if (row.key === 'theme_colors') settings[row.key] = JSON.parse(row.value);
        else if (row.key.startsWith('allow_')) settings[row.key] = row.value === 'true';
        else settings[row.key] = row.value;
      } catch (e) { log(`Error parsing setting ${row.key}`, { error: e.message, value: row.value }); }
    });
    if (!settings.default_organisation) settings.default_organisation = 'My Organisation';
    if (!settings.theme_colors || !Array.isArray(settings.theme_colors)) settings.theme_colors = getDefaultThemeColors();
    if (!settings.theme_variant) settings.theme_variant = 'swiish';
    if (settings.allow_theme_customisation === undefined) settings.allow_theme_customisation = true;
    if (settings.allow_image_customisation === undefined) settings.allow_image_customisation = true;
    if (settings.allow_links_customisation === undefined) settings.allow_links_customisation = true;
    if (settings.allow_privacy_customisation === undefined) settings.allow_privacy_customisation = true;
    if (settings.allow_send_details_customisation === undefined) settings.allow_send_details_customisation = true;
    res.json(settings);
  });
});

app.post('/api/admin/settings', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [
  body('default_organisation').optional().trim().isLength({ max: 200 }),
  body('theme_colors').optional().isArray(),
  body('theme_colors.*.name').optional().trim().isLength({ max: 50 }),
  body('theme_colors.*.gradient').optional().trim().isLength({ max: 200 }),
  body('theme_colors.*.button').optional().trim().isLength({ max: 200 }),
  body('theme_colors.*.link').optional().trim().isLength({ max: 200 }),
  body('theme_colors.*.text').optional().trim().isLength({ max: 200 }),
  body('theme_colors.*.gradientStyle').optional().trim().isLength({ max: 500 }),
  body('theme_colors.*.buttonStyle').optional().trim().isLength({ max: 50 }),
  body('theme_colors.*.linkStyle').optional().trim().isLength({ max: 50 }),
  body('theme_colors.*.textStyle').optional().trim().isLength({ max: 50 }),
  body('theme_colors.*.colorType').optional().isIn(['standard', 'custom']),
  body('theme_colors.*.hexBase').optional().custom((value) => { if (value === null || value === undefined || value === '') return true; return /^#[0-9A-Fa-f]{6}$/.test(value); }),
  body('theme_colors.*.hexSecondary').optional().custom((value) => { if (value === null || value === undefined || value === '') return true; return /^#[0-9A-Fa-f]{6}$/.test(value); }),
  body('theme_colors.*.baseColor').optional().trim().isLength({ max: 50 }),
  body('theme_colors.*.secondaryColor').optional().trim().isLength({ max: 50 }),
  body('theme_colors.*.shade').optional().isInt({ min: 100, max: 900 }),
  body('allow_theme_customisation').optional().isBoolean(),
  body('allow_image_customisation').optional().isBoolean(),
  body('allow_links_customisation').optional().isBoolean(),
  body('allow_privacy_customisation').optional().isBoolean(),
  body('allow_send_details_customisation').optional().isBoolean()
], handleValidationErrors, (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  const { default_organisation, theme_colors, theme_variant, allow_theme_customisation, allow_image_customisation, allow_links_customisation, allow_privacy_customisation, allow_send_details_customisation } = req.body;
  const promises = [];
  if (default_organisation !== undefined) {
    const sanitized = default_organisation.trim().substring(0, 200);
    promises.push(new Promise((resolve, reject) => {
      db.run("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(organisation_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [req.user.organisationId, 'default_organisation', sanitized], (err) => err ? reject(err) : resolve());
    }));
  }
  if (theme_colors !== undefined && Array.isArray(theme_colors)) {
    const sanitized = theme_colors.map(color => ({
      name: (color.name || '').trim().substring(0, 50), gradient: color.gradient ? (color.gradient || '').trim().substring(0, 200) : null, button: color.button ? (color.button || '').trim().substring(0, 200) : null, link: color.link ? (color.link || '').trim().substring(0, 200) : null, text: color.text ? (color.text || '').trim().substring(0, 200) : null,
      gradientStyle: color.gradientStyle || null, buttonStyle: color.buttonStyle || null, linkStyle: color.linkStyle || null, textStyle: color.textStyle || null,
      colorType: color.colorType || null, hexBase: color.hexBase || null, hexSecondary: color.hexSecondary || null, baseColor: color.baseColor || null, secondaryColor: color.secondaryColor || null, shade: color.shade || null
    }));
    promises.push(new Promise((resolve, reject) => {
      db.run("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(organisation_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [req.user.organisationId, 'theme_colors', JSON.stringify(sanitized)], (err) => err ? reject(err) : resolve());
    }));
  }
  if (theme_variant !== undefined) {
    const variant = typeof theme_variant === 'string' ? theme_variant.trim().substring(0, 50) : 'swiish';
    promises.push(new Promise((resolve, reject) => {
      db.run("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(organisation_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [req.user.organisationId, 'theme_variant', variant], (err) => err ? reject(err) : resolve());
    }));
  }
  const saveToggle = (key, value) => {
    if (value !== undefined && typeof value === 'boolean') {
      promises.push(new Promise((resolve, reject) => {
        db.run("INSERT INTO organisation_settings (organisation_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(organisation_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [req.user.organisationId, key, value ? 'true' : 'false'], (err) => err ? reject(err) : resolve());
      }));
    }
  };
  saveToggle('allow_theme_customisation', allow_theme_customisation);
  saveToggle('allow_image_customisation', allow_image_customisation);
  saveToggle('allow_links_customisation', allow_links_customisation);
  saveToggle('allow_privacy_customisation', allow_privacy_customisation);
  saveToggle('allow_send_details_customisation', allow_send_details_customisation);
  Promise.all(promises).then(() => res.json({ success: true })).catch((err) => next(err));
});

// --- USER MANAGEMENT ENDPOINTS (Owners only) ---
app.get('/api/admin/users', requireAuth, requireRole('owner'), apiLimiter, (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  db.all("SELECT id, email, role, created_at FROM users WHERE organisation_id = ? ORDER BY created_at DESC", [req.user.organisationId], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

app.post('/api/admin/users', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [
  body('email').isEmail({ allow_display_name: false, require_tld: false }),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['owner', 'member'])
], handleValidationErrors, async (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  const { email, password, role } = req.body;
  db.get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()], async (err, existingUser) => {
    if (err) return next(err);
    if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });
    db.get("SELECT id, status FROM invitations WHERE email = ? AND organisation_id = ? AND status IN ('pending', 'sent') AND expires_at > datetime('now')", [email.toLowerCase(), req.user.organisationId], (err, existingInvitation) => {
      if (err) return next(err);
      if (existingInvitation) return res.status(400).json({ error: 'An active invitation already exists for this email. Please wait for the user to accept the invitation or delete it first.', invitationStatus: existingInvitation.status });
      const userId = require('crypto').randomUUID();
      bcrypt.hash(password, 10, (err, passwordHash) => {
        if (err) return next(err);
        db.run("INSERT INTO users (id, email, password_hash, organisation_id, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)", [userId, email.toLowerCase(), passwordHash, req.user.organisationId, role, 0], (err) => {
          if (err) return next(err);
          res.json({ success: true, userId, email: email.toLowerCase(), role });
        });
      });
    });
  });
});

app.patch('/api/admin/users/:userId', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [param('userId').isUUID(), body('role').isIn(['owner', 'member'])], handleValidationErrors, (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  const { userId } = req.params;
  const { role } = req.body;
  if (userId === req.user.id) return res.status(400).json({ error: 'Cannot change your own role' });
  db.get("SELECT id, role FROM users WHERE id = ? AND organisation_id = ?", [userId, req.user.organisationId], (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'owner' && role === 'member') {
      db.get("SELECT COUNT(*) as count FROM users WHERE organisation_id = ? AND role = 'owner'", [req.user.organisationId], (err, ownerCount) => {
        if (err) return next(err);
        if (ownerCount.count === 1) return res.status(400).json({ error: 'Cannot remove last owner from organization' });
        db.run("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [role, userId], (err) => err ? next(err) : res.json({ success: true }));
      });
    } else {
      db.run("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [role, userId], (err) => err ? next(err) : res.json({ success: true }));
    }
  });
});

app.delete('/api/admin/users/:userId', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [param('userId').isUUID()], handleValidationErrors, async (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  const { userId } = req.params;
  if (userId === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT id, email, role, organisation_id FROM users WHERE id = ? AND organisation_id = ?", [userId, req.user.organisationId], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'owner') {
      const ownerCount = await new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) as count FROM users WHERE organisation_id = ? AND role = 'owner'", [req.user.organisationId], (err, row) => err ? reject(err) : resolve(row));
      });
      if (ownerCount.count === 1) return res.status(400).json({ error: 'Cannot delete last owner from organization' });
    }
    const cards = await new Promise((resolve, reject) => { db.all("SELECT * FROM cards WHERE user_id = ?", [userId], (err, rows) => err ? reject(err) : resolve(rows)); });
    const userSettings = await new Promise((resolve, reject) => { db.get("SELECT * FROM user_settings WHERE user_id = ?", [userId], (err, row) => err ? reject(err) : resolve(row)); });
    await logAudit('user_deleted', 'user', userId, { user, cards, settings: userSettings, card_count: cards.length }, req.user.id, req.user.organisationId);
    await new Promise((resolve, reject) => { db.run("DELETE FROM users WHERE id = ?", [userId], (err) => err ? reject(err) : resolve()); });
    console.log(`[USER DELETED] User ${user.email} deleted by ${req.user.email}, ${cards.length} cards cascaded`);
    res.json({ success: true, deletedCards: cards.length });
  } catch (err) { console.error('[USER DELETE ERROR]', err); next(err); }
});

// --- INVITATION ENDPOINTS ---
app.post('/api/admin/invitations', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [body('email').isEmail(), body('role').isIn(['owner', 'member'])], handleValidationErrors, async (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  const { email, role } = req.body;
  const emailLower = email.toLowerCase();
  try {
    const existingUser = await new Promise((resolve, reject) => { db.get("SELECT id FROM users WHERE email = ?", [emailLower], (err, row) => err ? reject(err) : resolve(row)); });
    if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });
    const existingInvitation = await new Promise((resolve, reject) => { db.get("SELECT id, status FROM invitations WHERE email = ? AND organisation_id = ? AND status IN ('pending', 'sent') AND expires_at > datetime('now')", [emailLower, req.user.organisationId], (err, row) => err ? reject(err) : resolve(row)); });
    if (existingInvitation) return res.status(400).json({ error: 'Active invitation already exists for this email', status: existingInvitation.status });
    const token = require('crypto').randomBytes(32).toString('hex');
    const invitationId = require('crypto').randomUUID();
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);
    await new Promise((resolve, reject) => { db.run("INSERT INTO invitations (id, organisation_id, email, token, role, invited_by, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [invitationId, req.user.organisationId, emailLower, token, role, req.user.id, expiresAt.toISOString()], (err) => err ? reject(err) : resolve()); });
    const org = await new Promise((resolve, reject) => { db.get("SELECT name FROM organisations WHERE id = ?", [req.user.organisationId], (err, row) => err ? reject(err) : resolve(row)); });
    const orgName = org ? org.name : 'Organization';
    let emailStatus = 'sent', emailError = null;
    try {
      if (emailTransporter) {
        const invitationUrl = `${APP_URL}/invite/${token}`;
        await emailTransporter.sendMail({ from: SMTP_FROM, to: emailLower, subject: `Invitation to join ${orgName} on Macarte`, text: `You've been invited to join ${orgName} on Macarte. Visit ${invitationUrl} to accept the invitation. This invitation expires in 7 days.`, html: `<h2>You've been invited to join ${orgName}</h2><p>You've been invited to join ${orgName} on Macarte. Click the link below to accept the invitation and create your account.</p><p><a href="${invitationUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a></p><p>This invitation will expire in 7 days.</p><p>If you didn't expect this invitation, you can safely ignore this email.</p>` });
      }
    } catch (emailErr) { console.error('Failed to send invitation email:', emailErr); emailStatus = 'failed'; emailError = emailErr.message; }
    await new Promise((resolve, reject) => { db.run("UPDATE invitations SET status = ? WHERE id = ?", [emailStatus, invitationId], (err) => err ? reject(err) : resolve()); });
    await logAudit('invitation_created', 'invitation', invitationId, { email: emailLower, role, status: emailStatus }, req.user.id, req.user.organisationId);
    res.json({ success: true, invitationId, expiresAt: expiresAt.toISOString(), status: emailStatus, ...(emailError && { warning: 'Invitation created but email failed to send. You can retry from the admin panel.' }) });
  } catch (err) { next(err); }
});

app.get('/api/invitations/:token', publicReadLimiter, [param('token').isLength({ min: 64, max: 64 })], handleValidationErrors, (req, res, next) => {
  const { token } = req.params;
  db.get("SELECT i.id, i.email, i.role, i.expires_at, i.accepted_at, o.name as organization_name FROM invitations i JOIN organisations o ON i.organisation_id = o.id WHERE i.token = ?", [token], (err, invitation) => {
    if (err) return next(err);
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
    if (invitation.accepted_at) return res.status(400).json({ error: 'Invitation has already been accepted' });
    if (new Date(invitation.expires_at) < new Date()) return res.status(400).json({ error: 'Invitation has expired' });
    res.json({ email: invitation.email, role: invitation.role, organisationName: invitation.organization_name, expiresAt: invitation.expires_at });
  });
});

app.post('/api/invitations/:token/accept', publicReadLimiter, [param('token').isLength({ min: 64, max: 64 }), body('password').isLength({ min: 8 }).matches(/[A-Za-z]/).matches(/\d/), body('confirmPassword').custom((value, { req }) => { if (value !== req.body.password) throw new Error('Passwords do not match'); return true; })], handleValidationErrors, async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  db.get("SELECT * FROM invitations WHERE token = ?", [token], async (err, invitation) => {
    if (err) return next(err);
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
    if (invitation.accepted_at) return res.status(400).json({ error: 'Invitation has already been accepted' });
    if (new Date(invitation.expires_at) < new Date()) return res.status(400).json({ error: 'Invitation has expired' });
    db.get("SELECT id FROM users WHERE email = ?", [invitation.email], async (err, existingUser) => {
      if (err) return next(err);
      if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });
      const userId = require('crypto').randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);
      db.run("INSERT INTO users (id, email, password_hash, organisation_id, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)", [userId, invitation.email, passwordHash, invitation.organisation_id, invitation.role, 0], (err) => {
        if (err) return next(err);
        db.run("UPDATE invitations SET accepted_at = CURRENT_TIMESTAMP, status = 'accepted' WHERE id = ?", [invitation.id], async (err) => {
          if (err) console.error('Failed to mark invitation as accepted:', err);
          else { try { await logAudit('invitation_accepted', 'invitation', invitation.id, { email: invitation.email, role: invitation.role }, userId, invitation.organisation_id); } catch (auditErr) { console.error('Failed to log invitation acceptance audit:', auditErr); } }
          const jwtToken = jwt.sign({ user_id: userId, organisation_id: invitation.organisation_id, role: invitation.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
          res.cookie('authToken', jwtToken, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
          res.json({ success: true, userId, email: invitation.email, role: invitation.role });
        });
      });
    });
  });
});

app.get('/api/admin/invitations', requireAuth, requireRole('owner'), apiLimiter, (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  db.all(`SELECT i.id, i.email, i.role, i.status, i.created_at, i.expires_at, i.accepted_at, u.email as invited_by_email FROM invitations i LEFT JOIN users u ON i.invited_by = u.id WHERE i.organisation_id = ? ORDER BY i.created_at DESC`, [req.user.organisationId], (err, invitations) => {
    if (err) return next(err);
    res.json({ invitations });
  });
});

app.delete('/api/admin/invitations/:invitationId', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [param('invitationId').isUUID()], handleValidationErrors, async (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  const { invitationId } = req.params;
  try {
    const invitation = await new Promise((resolve, reject) => { db.get("SELECT id, email, status, accepted_at FROM invitations WHERE id = ? AND organisation_id = ?", [invitationId, req.user.organisationId], (err, row) => err ? reject(err) : resolve(row)); });
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
    if (invitation.accepted_at) return res.status(400).json({ error: 'Cannot delete accepted invitation' });
    await logAudit('invitation_deleted', 'invitation', invitationId, { email: invitation.email, status: invitation.status }, req.user.id, req.user.organisationId);
    await new Promise((resolve, reject) => { db.run("DELETE FROM invitations WHERE id = ?", [invitationId], (err) => err ? reject(err) : resolve()); });
    res.json({ success: true });
  } catch (err) { next(err); }
});

app.post('/api/admin/invitations/:invitationId/retry', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [param('invitationId').isUUID()], handleValidationErrors, async (req, res, next) => {
  if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
  const { invitationId } = req.params;
  try {
    const invitation = await new Promise((resolve, reject) => { db.get(`SELECT i.*, o.name as org_name FROM invitations i JOIN organisations o ON i.organisation_id = o.id WHERE i.id = ? AND i.organisation_id = ?`, [invitationId, req.user.organisationId], (err, row) => err ? reject(err) : resolve(row)); });
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
    if (invitation.status !== 'failed' && invitation.status !== 'pending') return res.status(400).json({ error: `Cannot retry invitation with status: ${invitation.status}` });
    if (new Date(invitation.expires_at) < new Date()) return res.status(400).json({ error: 'Invitation has expired. Please delete and create a new one.' });
    let emailStatus = 'sent', emailError = null;
    try {
      if (emailTransporter) {
        const invitationUrl = `${APP_URL}/invite/${invitation.token}`;
        await emailTransporter.sendMail({ from: SMTP_FROM, to: invitation.email, subject: `Invitation to join ${invitation.org_name} on Macarte`, text: `You've been invited to join ${invitation.org_name} on Macarte. Visit ${invitationUrl} to accept the invitation. This invitation expires in 7 days.`, html: `<h2>You've been invited to join ${invitation.org_name}</h2><p>You've been invited to join ${invitation.org_name} on Macarte. Click the link below to accept the invitation and create your account.</p><p><a href="${invitationUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a></p><p>This invitation will expire in 7 days.</p><p>If you didn't expect this invitation, you can safely ignore this email.</p>` });
      }
    } catch (emailErr) { console.error('Failed to send invitation email:', emailErr); emailStatus = 'failed'; emailError = emailErr.message; }
    await new Promise((resolve, reject) => { db.run("UPDATE invitations SET status = ? WHERE id = ?", [emailStatus, invitationId], (err) => err ? reject(err) : resolve()); });
    await logAudit('invitation_retry', 'invitation', invitationId, { email: invitation.email, new_status: emailStatus }, req.user.id, req.user.organisationId);
    res.json({ success: emailStatus === 'sent', status: emailStatus, ...(emailError && { error: 'Email failed to send. Please check SMTP configuration.' }) });
  } catch (err) { next(err); }
});

// --- PASSWORD RESET ENDPOINTS ---
app.post('/api/auth/forgot-password', apiLimiter, [body('email').isEmail()], handleValidationErrors, async (req, res, next) => {
  const { email } = req.body;
  const emailLower = email.toLowerCase();
  db.get("SELECT id, email FROM users WHERE email = ?", [emailLower], async (err, user) => {
    if (err) return next(err);
    if (!user) return res.json({ success: true, message: 'If an account exists with this email, a password reset link has been sent' });
    const token = require('crypto').randomBytes(32).toString('hex');
    const tokenId = require('crypto').randomUUID();
    const expiresAt = new Date(); expiresAt.setHours(expiresAt.getHours() + 1);
    db.run("DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL", [user.id], (err) => {
      if (err) console.error('Error deleting old tokens:', err);
      db.run("INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", [tokenId, user.id, token, expiresAt.toISOString()], async (err) => {
        if (err) return next(err);
        const resetUrl = `${APP_URL}/reset-password/${token}`;
        try {
          if (emailTransporter) await emailTransporter.sendMail({ from: SMTP_FROM, to: emailLower, subject: 'Reset your Macarte password', text: `You requested to reset your password. Visit ${resetUrl} to reset it. This link expires in 1 hour.`, html: `<h2>Password Reset Request</h2><p>You requested to reset your password for your Macarte account. Click the link below to reset your password:</p><p><a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you didn't request a password reset, you can safely ignore this email.</p>` });
        } catch (emailErr) { console.error('Failed to send password reset email:', emailErr); }
        res.json({ success: true, message: 'If an account exists with this email, a password reset link has been sent' });
      });
    });
  });
});

app.post('/api/auth/reset-password', apiLimiter, [body('token').isLength({ min: 64, max: 64 }), body('password').isLength({ min: 8 })], handleValidationErrors, async (req, res, next) => {
  const { token, password } = req.body;
  db.get("SELECT prt.*, u.id as user_id FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE prt.token = ?", [token], async (err, resetToken) => {
    if (err) return next(err);
    if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset token' });
    if (resetToken.used_at) return res.status(400).json({ error: 'This reset token has already been used' });
    if (new Date(resetToken.expires_at) < new Date()) return res.status(400).json({ error: 'Reset token has expired' });
    const passwordHash = await bcrypt.hash(password, 10);
    db.run("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [passwordHash, resetToken.user_id], (err) => {
      if (err) return next(err);
      db.run("UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [resetToken.id], (err) => { if (err) console.error('Failed to mark token as used:', err); });
      res.json({ success: true, message: 'Password has been reset successfully' });
    });
  });
});

app.post('/api/auth/change-password', requireAuth, apiLimiter, csrfProtection, [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })], handleValidationErrors, async (req, res, next) => {
  if (!req.user.id) return res.status(401).json({ error: 'Unauthorized' });
  const { currentPassword, newPassword } = req.body;
  db.get("SELECT password_hash FROM users WHERE id = ?", [req.user.id], async (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Current password is incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    db.run("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [passwordHash, req.user.id], (err) => err ? next(err) : res.json({ success: true, message: 'Password has been changed successfully' }));
  });
});

// --- EMAIL VERIFICATION ENDPOINTS ---
app.post('/api/auth/send-verification', requireAuth, apiLimiter, csrfProtection, async (req, res, next) => {
  if (!req.user.id) return res.status(401).json({ error: 'Unauthorized' });
  db.get("SELECT email, email_verified FROM users WHERE id = ?", [req.user.id], async (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) return res.status(400).json({ error: 'Email is already verified' });
    db.get("SELECT id FROM email_verification_tokens WHERE user_id = ? AND verified_at IS NULL AND expires_at > datetime('now')", [req.user.id], async (err, existingToken) => {
      if (err) return next(err);
      if (existingToken) return res.status(400).json({ error: 'Verification email already sent. Please check your email or wait before requesting another.' });
      const token = require('crypto').randomBytes(32).toString('hex');
      const tokenId = require('crypto').randomUUID();
      const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);
      db.run("INSERT INTO email_verification_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", [tokenId, req.user.id, token, expiresAt.toISOString()], async (err) => {
        if (err) return next(err);
        const verifyUrl = `${APP_URL}/verify-email/${token}`;
        try {
          if (emailTransporter) await emailTransporter.sendMail({ from: SMTP_FROM, to: user.email, subject: 'Verify your Macarte email address', text: `Please verify your email address by visiting ${verifyUrl}. This link expires in 7 days.`, html: `<h2>Verify Your Email Address</h2><p>Please verify your email address by clicking the link below:</p><p><a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p><p>This link will expire in 7 days.</p><p>If you didn't create an account, you can safely ignore this email.</p>` });
        } catch (emailErr) { console.error('Failed to send verification email:', emailErr); return res.status(500).json({ error: 'Failed to send verification email' }); }
        res.json({ success: true, message: 'Verification email sent' });
      });
    });
  });
});

app.get('/api/auth/verify-email/:token', publicReadLimiter, [param('token').isLength({ min: 64, max: 64 })], handleValidationErrors, (req, res, next) => {
  const { token } = req.params;
  db.get("SELECT evt.*, u.id as user_id, u.email FROM email_verification_tokens evt JOIN users u ON evt.user_id = u.id WHERE evt.token = ?", [token], (err, verificationToken) => {
    if (err) return next(err);
    if (!verificationToken) return res.status(400).json({ error: 'Invalid or expired verification token' });
    if (verificationToken.verified_at) return res.status(400).json({ error: 'Email has already been verified' });
    if (new Date(verificationToken.expires_at) < new Date()) return res.status(400).json({ error: 'Verification token has expired' });
    db.run("UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [verificationToken.user_id], (err) => {
      if (err) return next(err);
      db.run("UPDATE email_verification_tokens SET verified_at = CURRENT_TIMESTAMP WHERE id = ?", [verificationToken.id], (err) => { if (err) console.error('Failed to mark token as verified:', err); });
      res.json({ success: true, message: 'Email verified successfully' });
    });
  });
});

// Dynamic per-card manifest endpoint
app.get('/manifest/:slug.json', publicReadLimiter, [identifierValidation], handleValidationErrors, async (req, res, next) => {
  const originalIdentifier = req.params.slug;
  const isShortCode = /^[a-zA-Z0-9]{7}$/.test(originalIdentifier);
  const identifier = isShortCode ? originalIdentifier : originalIdentifier.toLowerCase();
  let baseManifest = { short_name: 'Macarte', name: 'Macarte', start_url: '.', display: 'standalone', background_color: '#0f766e', theme_color: '#0f766e', icons: [{ src: '/swiish-logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] };
  try {
    const manifestPath = path.join(__dirname, 'public', 'manifest.json');
    try {
      const raw = await fs.promises.readFile(manifestPath, 'utf8');
      const parsed = JSON.parse(raw);
      baseManifest = { short_name: parsed.short_name || baseManifest.short_name, name: parsed.name || baseManifest.name, start_url: parsed.start_url || baseManifest.start_url, display: parsed.display || baseManifest.display, background_color: parsed.background_color || baseManifest.background_color, theme_color: parsed.theme_color || baseManifest.theme_color, icons: Array.isArray(parsed.icons) && parsed.icons.length > 0 ? parsed.icons : baseManifest.icons };
    } catch (readErr) {}
  } catch (err) { console.error('Failed to read base manifest:', err); }
  const query = isShortCode ? "SELECT data, slug FROM cards WHERE short_code = ?" : "SELECT data, slug FROM cards WHERE slug = ?";
  db.get(query, [identifier], (err, row) => {
    if (err) return next(err);
    if (!row) return res.status(404).json({ error: 'Card not found' });
    const cardSlug = row.slug;
    let cardName = 'Macarte';
    if (row && row.data) {
      try {
        const parsed = JSON.parse(row.data);
        const first = (parsed.personal?.firstName || '').trim();
        const last = (parsed.personal?.lastName || '').trim();
        const full = `${first} ${last}`.trim();
        cardName = full || parsed.personal?.company || cardName;
      } catch (e) {}
    }
    const startUrl = `/${identifier}/`;
    const manifest = { ...baseManifest, name: cardName, short_name: cardName.length > 20 ? cardName.slice(0, 20) : cardName, start_url: startUrl, scope: startUrl, icons: [{ src: `/icons/${cardSlug}.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }, { src: `/icons/${cardSlug}.svg`, sizes: '192x192', type: 'image/svg+xml' }, { src: `/icons/${cardSlug}.svg`, sizes: '512x512', type: 'image/svg+xml' }] };
    res.json(manifest);
  });
});

// Dynamic themed SVG icon endpoint
app.get('/icons/:slug.svg', publicReadLimiter, [identifierValidation], handleValidationErrors, (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  db.get(`SELECT c.data, u.organisation_id FROM cards c JOIN users u ON c.user_id = u.id WHERE c.slug = ?`, [slug], (err, row) => {
    if (err) return next(err);
    if (!row) return res.status(404).type('image/svg+xml').send(`<svg xmlns="http://www.w3.org/2000/svg"><text>Card not found</text></svg>`);
    let themeColor = 'indigo';
    if (row.data) { try { const parsed = JSON.parse(row.data); themeColor = parsed.theme?.color || 'indigo'; } catch (e) {} }
    const orgId = row.organisation_id;
    if (!orgId) {
      const fillColor = getThemeColorHex(themeColor);
      const svgPath = "M356.35,66.77h-59.65v-27.16c0-21.79-17.83-39.62-39.62-39.62H6.6C2.96,0,0,2.96,0,6.6v130.94c0,21.79,17.83,39.62,39.62,39.62h35.71c3.08,0,5.57-2.49,5.57-5.57v-78.41c0-14.59,11.82-26.41,26.41-26.41h16.52c3.65,0,6.6,2.96,6.6,6.6v8.49c0,3.65-2.96,6.6-6.6,6.6h-9.13c-3.65,0-6.6,2.96-6.6,6.6v76.53c0,3.08,2.49,5.57,5.57,5.57h143.42c21.79,0,39.62-17.83,39.62-39.62v-44.37h59.65c7.26,0,13.21,5.94,13.21,13.21v127.63c0,7.26-5.94,13.21-13.21,13.21H121.01c-7.26,0-13.21-5.94-13.21-13.21v-6.83c0-3.65-2.96-6.6-6.6-6.6h-13.21c-3.65,0-6.6,2.96-6.6,6.6v6.83c0,21.79,17.83,39.62,39.62,39.62h235.34c21.79,0,39.62-17.83,39.62-39.62v-127.63c0-21.79-17.83-39.62-39.62-39.62Z";
      return res.type('image/svg+xml').send(`<?xml version="1.0" encoding="UTF-8"?><svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 395.96 273.63"><g id="Layer_1-2" data-name="Layer 1"><path fill="${fillColor}" d="${svgPath}"/></g></svg>`);
    }
    db.get(`SELECT os.value FROM organisation_settings os WHERE os.organisation_id = ? AND os.key = ?`, [orgId, 'theme_colors'], (settingsErr, settingsRow) => {
      let fillColor = '#4f46e5';
      if (!settingsErr && settingsRow && settingsRow.value) {
        try {
          const theme_colors = JSON.parse(settingsRow.value);
          const colorEntry = theme_colors.find(c => c.name === themeColor);
          if (colorEntry) fillColor = colorEntry.textStyle || colorEntry.hexBase || getThemeColorHex(themeColor);
          else fillColor = getThemeColorHex(themeColor);
        } catch (e) { fillColor = getThemeColorHex(themeColor); }
      } else { fillColor = getThemeColorHex(themeColor); }
      const svgPath = "M356.35,66.77h-59.65v-27.16c0-21.79-17.83-39.62-39.62-39.62H6.6C2.96,0,0,2.96,0,6.6v130.94c0,21.79,17.83,39.62,39.62,39.62h35.71c3.08,0,5.57-2.49,5.57-5.57v-78.41c0-14.59,11.82-26.41,26.41-26.41h16.52c3.65,0,6.6,2.96,6.6,6.6v8.49c0,3.65-2.96,6.6-6.6,6.6h-9.13c-3.65,0-6.6,2.96-6.6,6.6v76.53c0,3.08,2.49,5.57,5.57,5.57h143.42c21.79,0,39.62-17.83,39.62-39.62v-44.37h59.65c7.26,0,13.21,5.94,13.21,13.21v127.63c0,7.26-5.94,13.21-13.21,13.21H121.01c-7.26,0-13.21-5.94-13.21-13.21v-6.83c0-3.65-2.96-6.6-6.6-6.6h-13.21c-3.65,0-6.6,2.96-6.6,6.6v6.83c0,21.79,17.83,39.62,39.62,39.62h235.34c21.79,0,39.62-17.83,39.62-39.62v-127.63c0-21.79-17.83-39.62-39.62-39.62Z";
      res.type('image/svg+xml').send(`<?xml version="1.0" encoding="UTF-8"?><svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 395.96 273.63"><g id="Layer_1-2" data-name="Layer 1"><path fill="${fillColor}" d="${svgPath}"/></g></svg>`);
    });
  });
});

app.get('/api/admin/logs', requireAuth, apiLimiter, (req, res, next) => {
  try { res.json({ logs: logLines.slice(-100), totalLines: logLines.length }); } catch (err) { next(err); }
});

app.get('/api/qr/:identifier', publicReadLimiter, [param('identifier').trim().matches(/^[a-zA-Z0-9-]+$/)], handleValidationErrors, async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    const baseUrl = req.protocol + '://' + req.get('host');
    const isShortCode = /^[a-zA-Z0-9]{7}$/.test(identifier);
    let cardUrl;
    if (isShortCode) {
      cardUrl = `${baseUrl}/${identifier}`;
      const qrDataUrl = await QRCode.toDataURL(cardUrl, { errorCorrectionLevel: 'M', type: 'image/png', width: 200, margin: 1 });
      res.json({ qrCode: qrDataUrl });
    } else {
      const slug = identifier.toLowerCase();
      db.get("SELECT short_code FROM cards WHERE slug = ? LIMIT 1", [slug], async (err, row) => {
        if (err) return next(err);
        if (!row || !row.short_code) return res.status(404).json({ error: "Card not found" });
        cardUrl = `${baseUrl}/${row.short_code}`;
        try {
          const qrDataUrl = await QRCode.toDataURL(cardUrl, { errorCorrectionLevel: 'M', type: 'image/png', width: 200, margin: 1 });
          res.json({ qrCode: qrDataUrl });
        } catch (qrErr) { next(qrErr); }
      });
    }
  } catch (err) { next(err); }
});

app.post('/api/qr/:identifier', publicReadLimiter, [param('identifier').trim().matches(/^[a-zA-Z0-9-]+$/), body('payload').optional().isString().isLength({ max: 5000 })], handleValidationErrors, async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    const baseUrl = req.protocol + '://' + req.get('host');
    const isShortCode = /^[a-zA-Z0-9]{7}$/.test(identifier);
    let cardUrl;
    if (isShortCode) {
      cardUrl = `${baseUrl}/${identifier}`;
    } else {
      const slug = identifier.toLowerCase();
      db.get("SELECT short_code FROM cards WHERE slug = ? LIMIT 1", [slug], async (err, row) => {
        if (err) return next(err);
        if (!row || !row.short_code) return res.status(404).json({ error: "Card not found" });
        cardUrl = `${baseUrl}/${row.short_code}`;
        let qrContent = cardUrl;
        if (typeof req.body?.payload === 'string' && req.body.payload.trim()) qrContent = req.body.payload.trim();
        try {
          const qrDataUrl = await QRCode.toDataURL(qrContent, { errorCorrectionLevel: 'M', type: 'image/png', width: 200, margin: 1 });
          res.json({ qrCode: qrDataUrl });
        } catch (qrErr) { next(qrErr); }
      });
      return;
    }
    let qrContent = cardUrl;
    if (typeof req.body?.payload === 'string' && req.body.payload.trim()) qrContent = req.body.payload.trim();
    const qrDataUrl = await QRCode.toDataURL(qrContent, { errorCorrectionLevel: 'M', type: 'image/png', width: 200, margin: 1 });
    res.json({ qrCode: qrDataUrl });
  } catch (err) { next(err); }
});



// Error handling middleware (must be last)
app.use(errorHandler);

// Helper function to inject meta tags for social media sharing
async function injectMetaTags(html, cardIdentifier, displayIdentifier) {
  let cardRow;
  if (displayIdentifier.includes('/')) {
    const [orgSlug, cardSlug] = displayIdentifier.split('/');
    cardRow = await new Promise((resolve, reject) => {
      db.get(`SELECT c.data, c.short_code, c.updated_at FROM cards c JOIN users u ON c.user_id = u.id JOIN organisations o ON u.organisation_id = o.id WHERE LOWER(o.slug) = LOWER(?) AND LOWER(c.slug) = LOWER(?) LIMIT 1`, [orgSlug, cardSlug], (err, row) => err ? reject(err) : resolve(row));
    });
  } else {
    cardRow = await new Promise((resolve, reject) => {
      db.get(`SELECT c.data, c.short_code, c.updated_at FROM cards c WHERE c.short_code = ? OR LOWER(c.slug) = LOWER(?) LIMIT 1`, [cardIdentifier, cardIdentifier], (err, row) => err ? reject(err) : resolve(row));
    });
  }
  if (!cardRow) return html;
  try {
    const cardData = JSON.parse(cardRow.data);
    const privacy = cardData.privacy || {};
    if (privacy.blockRobots) {
      const robotsMeta = `<title>Private Card</title><meta name="robots" content="noindex, nofollow"><meta name="googlebot" content="noindex, nofollow">`;
      html = html.replace(/<title>.*?<\/title>/i, '');
      return html.replace('</head>', robotsMeta + '</head>');
    }
    if (privacy.requireInteraction || privacy.clientSideObfuscation) {
      const privateMeta = `<title>Card Preview</title><meta name="robots" content="noindex, follow">`;
      html = html.replace(/<title>.*?<\/title>/i, '');
      return html.replace('</head>', privateMeta + '</head>');
    }
    const firstName = escapeXml(cardData.personal?.firstName || '');
    const lastName = escapeXml(cardData.personal?.lastName || '');
    const title = escapeXml(cardData.personal?.title || '');
    const company = escapeXml(cardData.personal?.company || '');
    const fullName = `${firstName} ${lastName}`.trim();
    const description = title ? `${title} at ${company}` : company || 'Digital Business Card';
    const previewIdentifier = cardRow.short_code || cardIdentifier;
    const updateTimestamp = cardRow.updated_at ? new Date(cardRow.updated_at).getTime() : Date.now();
    const previewUrl = `${APP_URL}/api/cards/${previewIdentifier}/preview.png?v=${updateTimestamp}`;
    const cardUrl = `${APP_URL}/${displayIdentifier}`;
    const metaTags = `<title>${fullName} - Digital Business Card</title><meta name="description" content="${description}"><meta property="og:url" content="${escapeXml(cardUrl)}"><meta property="og:title" content="${fullName}"><meta property="og:description" content="${description}"><meta property="og:image" content="${escapeXml(previewUrl)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png"><meta property="og:type" content="profile"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${fullName}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${escapeXml(previewUrl)}"><meta name="robots" content="index, follow">`;
    html = html.replace(/<title>.*?<\/title>/i, '');
    return html.replace('</head>', metaTags + '</head>');
  } catch (err) { console.error('[Meta Tags] Error parsing card data:', err.message); return html; }
}

// SPA Fallback
app.get('*', publicReadLimiter, async (req, res, next) => {
  if (req.path.startsWith('/static/') || req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/manifest/') || req.path.startsWith('/icons/')) return res.status(404).json({ error: 'Not found' });
  try {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    let html = await fs.promises.readFile(indexPath, 'utf8');
    const pathParts = req.path.slice(1).split('/').filter(p => p.length > 0);
    const isShortCode = pathParts.length === 1 && /^[a-zA-Z0-9]{7}$/.test(pathParts[0]);
    if (isShortCode) {
      html = await injectMetaTags(html, pathParts[0], pathParts[0]);
    } else if (pathParts.length === 2) {
      html = await injectMetaTags(html, pathParts[1], `${pathParts[0]}/${pathParts[1]}`);
    } else if (pathParts.length === 1) {
      html = await injectMetaTags(html, pathParts[0], pathParts[0]);
    }
    html = html.replace(/<script(\s|>)/gi, `<script nonce="${res.locals.nonce}"$1`);
    html = html.replace(/%PUBLIC_URL%/g, '');
    res.set({ 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0', 'Content-Type': 'text/html; charset=utf-8' });
    res.send(html);
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Not found' });
    next(err);
  }
});

// --- DEMO MODE FUNCTIONS ---
async function seedDemoData() {
  if (!IS_DEMO_MODE) return;
  try {
    log('[DEMO MODE] Seeding fresh demo data for Demon Straight...');
    await new Promise((resolve) => { db.run('DELETE FROM cards WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)', ['%@demonstraight.com'], () => resolve()); });
    await new Promise((resolve) => { db.run('DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)', ['%@demonstraight.com'], () => resolve()); });
    await new Promise((resolve) => { db.run('DELETE FROM users WHERE email LIKE ?', ['%@demonstraight.com'], () => resolve()); });
    await new Promise((resolve) => { db.run('DELETE FROM organisation_settings WHERE organisation_id IN (SELECT id FROM organisations WHERE slug = ?)', ['demon-straight'], () => resolve()); });
    await new Promise((resolve) => { db.run('DELETE FROM organisations WHERE slug = ?', ['demon-straight'], () => resolve()); });
    
    const demoUsers = [{ email: 'alex@demonstraight.com', role: 'owner' }, { email: 'maria@demonstraight.com', role: 'member' }, { email: 'james@demonstraight.com', role: 'member' }, { email: 'sarah@demonstraight.com', role: 'member' }, { email: 'david@demonstraight.com', role: 'member' }, { email: 'emma@demonstraight.com', role: 'member' }];
    const { randomUUID } = require('crypto');
    const demoOrgId = randomUUID();
    const demoUserIds = demoUsers.map(() => randomUUID());
    
    await new Promise((resolve, reject) => { db.run('INSERT INTO organisations (id, name, slug) VALUES (?, ?, ?)', [demoOrgId, 'Demon Straight', 'demon-straight'], (err) => err ? reject(err) : resolve()); });
    const settings = [{ key: 'default_organisation', value: 'Demon Straight' }, { key: 'theme_colors', value: JSON.stringify(getDefaultThemeColors()) }, { key: 'theme_variant', value: 'swiish' }, { key: 'allow_theme_customisation', value: '1' }, { key: 'allow_image_customisation', value: '1' }, { key: 'allow_links_customisation', value: '1' }, { key: 'allow_privacy_customisation', value: '1' }, { key: 'allow_send_details_customisation', value: 'true' }];
    for (const setting of settings) { await new Promise((resolve, reject) => { db.run('INSERT INTO organisation_settings (organisation_id, key, value) VALUES (?, ?, ?)', [demoOrgId, setting.key, setting.value], (err) => err ? reject(err) : resolve()); }); }
    
    const hashedPassword = await new Promise((resolve, reject) => { bcrypt.hash('demo123', 10, (err, hash) => err ? reject(err) : resolve(hash)); });
    for (let i = 0; i < demoUsers.length; i++) {
      await new Promise((resolve, reject) => { db.run(`INSERT INTO users (id, organisation_id, email, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)`, [demoUserIds[i], demoOrgId, demoUsers[i].email, hashedPassword, demoUsers[i].role, 1], (err) => err ? reject(err) : resolve()); });
    }
    DEMO_USER_ID = demoUserIds[0];
    
    const demoCards = [
      { userId: demoUserIds[0], slug: 'alex-ruler', shortCode: 'RULER01', data: { personal: { firstName: 'Alex', lastName: 'Ruler', title: 'Chief Straightness Officer & Founder', company: 'Demon Straight', bio: '30 years making things straight. Never once made a curve. Not even by accident.', location: 'London, UK' }, contact: { email: 'alex@demonstraight.com', phone: '+44 20 7946 0958', website: 'https://demonstraight.demo' }, social: { linkedin: 'https://linkedin.com/in/demo-alex-ruler', twitter: 'https://twitter.com/demo_ruler' }, theme: { color: 'indigo', style: 'modern' }, images: { avatar: '/demo/avatar-1.jpg', banner: '/demo/banner-1.jpg' }, links: [{ icon: 'globe', title: 'Company Website', url: 'https://demonstraight.demo', visible: true }, { icon: 'download', title: 'Download Product Catalogue', url: 'https://demonstraight.demo/catalogue.pdf', visible: true }, { icon: 'zap', title: 'View Latest Straightness Report', url: 'https://demonstraight.demo/reports/latest', visible: true }, { icon: 'calendar', title: 'Book a Meeting', url: 'https://calendly.com/demo-alex', visible: true }], privacy: { requireInteraction: false, clientSideObfuscation: false, blockRobots: false } } },
      { userId: demoUserIds[1], slug: 'maria-lines', shortCode: 'LINES02', data: { personal: { firstName: 'Maria', lastName: 'Lines', title: 'Director of Perfectly Straight Design', company: 'Demon Straight', bio: "If it's not straight, I won't design it. My protractor has never measured an angle.", location: 'Manchester, UK' }, contact: { email: 'maria@demonstraight.com', website: 'https://portfolio.demo.com/maria' }, social: { linkedin: 'https://linkedin.com/in/demo-maria-lines' }, theme: { color: 'purple', style: 'modern' }, images: { avatar: '/demo/avatar-2.jpg', banner: '/demo/banner-1.jpg' }, links: [{ icon: 'eye', title: 'View Design Portfolio', url: 'https://portfolio.demo.com/maria', visible: true }, { icon: 'book', title: 'Design Principles Guide', url: 'https://portfolio.demo.com/maria/principles', visible: true }, { icon: 'image', title: 'Latest Design Work', url: 'https://portfolio.demo.com/maria/work', visible: true }, { icon: 'mail', title: 'Enquire About Design Work', url: 'mailto:maria@demonstraight.com?subject=Design%20Inquiry', visible: true }], privacy: { requireInteraction: true, clientSideObfuscation: false, blockRobots: false } } },
      { userId: demoUserIds[2], slug: 'james-level', shortCode: 'LEVEL03', data: { personal: { firstName: 'James', lastName: 'Level', title: 'Head of Straightness Solutions', company: 'Demon Straight', bio: "Connecting businesses with our straight products. My sales pitch? It's perfectly straight.", location: 'Birmingham, UK' }, contact: { email: 'james@demonstraight.com', phone: '+44 121 555 0123' }, social: { linkedin: 'https://linkedin.com/in/demo-james-level' }, theme: { color: 'blue', style: 'modern' }, images: { avatar: '/demo/avatar-3.jpg', banner: '/demo/banner-1.jpg' }, links: [{ icon: 'play', title: 'Request a Product Demo', url: 'https://demonstraight.demo/demo-request', visible: true }, { icon: 'trending-up', title: 'View Case Studies', url: 'https://demonstraight.demo/case-studies', visible: true }, { icon: 'credit-card', title: 'Download Pricing', url: 'https://demonstraight.demo/pricing.pdf', visible: true }, { icon: 'phone', title: 'Call Sales Team', url: 'tel:+441215550123', visible: true }], privacy: { requireInteraction: false, clientSideObfuscation: false, blockRobots: false } } },
      { userId: demoUserIds[3], slug: 'sarah-edge', shortCode: 'EDGE04', data: { personal: { firstName: 'Sarah', lastName: 'Edge', title: 'Marketing & Straight Talk Lead', company: 'Demon Straight', bio: 'No curves in our messaging. Just straight facts about straight products.', location: 'Bristol, UK' }, contact: { email: 'sarah@demonstraight.com' }, social: { twitter: 'https://twitter.com/demo_sarah', linkedin: 'https://linkedin.com/in/demo-sarah-edge' }, theme: { color: 'pink', style: 'modern' }, images: { avatar: '/demo/avatar-4.jpg', banner: '/demo/banner-1.jpg' }, links: [{ icon: 'book', title: 'Read Our Blog', url: 'https://blog.demonstraight.demo', visible: true }, { icon: 'send', title: 'Subscribe to Newsletter', url: 'https://demonstraight.demo/newsletter', visible: true }, { icon: 'package', title: 'Download Media Kit', url: 'https://demonstraight.demo/media-kit.zip', visible: true }, { icon: 'file', title: 'Press Releases', url: 'https://demonstraight.demo/press', visible: true }], privacy: { requireInteraction: false, clientSideObfuscation: false, blockRobots: false } } },
      { userId: demoUserIds[4], slug: 'david-plumb', shortCode: 'PLUMB05', data: { personal: { firstName: 'David', lastName: 'Plumb', title: 'Senior Straightness Engineer', company: 'Demon Straight', bio: 'I write code as straight as our products. Zero tolerance for crooked semicolons.', location: 'Edinburgh, UK' }, contact: { email: 'david@demonstraight.com' }, social: { github: 'https://github.com/demo-david-plumb', linkedin: 'https://linkedin.com/in/demo-david-plumb' }, theme: { color: 'emerald', style: 'modern' }, images: { avatar: '/demo/avatar-5.jpg', banner: '/demo/banner-1.jpg' }, links: [{ icon: 'code', title: 'View Our Tech Stack', url: 'https://github.com/demon-straight-tech', visible: true }, { icon: 'zap', title: 'Engineering Blog', url: 'https://tech.demonstraight.demo', visible: true }, { icon: 'book', title: 'API Documentation', url: 'https://api.demonstraight.demo/docs', visible: true }, { icon: 'package', title: 'Open Source Projects', url: 'https://github.com/demon-straight', visible: true }], privacy: { requireInteraction: true, clientSideObfuscation: false, blockRobots: false } } },
      { userId: demoUserIds[5], slug: 'emma-align', shortCode: 'ALIGN06', data: { personal: { firstName: 'Emma', lastName: 'Align', title: 'Minimalist Designer', company: 'Demon Straight', bio: 'Less is more. Straight is best.', location: 'Leeds, UK' }, contact: { email: 'emma@demonstraight.com' }, social: { linkedin: 'https://linkedin.com/in/demo-emma-align' }, theme: { color: 'slate', style: 'modern' }, images: { avatar: '/demo/avatar-6.jpg' }, links: [{ icon: 'minus', title: 'View Minimal Design Work', url: 'https://portfolio.demo.com/emma/minimal', visible: true }], privacy: { requireInteraction: false, clientSideObfuscation: false, blockRobots: false } } }
    ];
    for (const card of demoCards) { await new Promise((resolve, reject) => { db.run(`INSERT INTO cards (user_id, slug, short_code, data) VALUES (?, ?, ?, ?)`, [card.userId, card.slug, card.shortCode, JSON.stringify(card.data)], (err) => err ? reject(err) : resolve()); }); }
    log('[DEMO MODE] Created 6 demo cards for Demon Straight');
  } catch (error) { console.error('[DEMO MODE] Error seeding demo data:', error); throw error; }
}

function startDemoResetTimer() {
  if (!IS_DEMO_MODE) return;
  const resetInterval = 60 * 60 * 1000;
  setInterval(async () => {
    try {
      log('[DEMO MODE] Starting hourly reset - wiping demo data...');
      await new Promise((resolve) => { db.run('DELETE FROM cards WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)', ['%@demonstraight.com'], () => resolve()); });
      await new Promise((resolve) => { db.run('DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)', ['%@demonstraight.com'], () => resolve()); });
      await new Promise((resolve) => { db.run('DELETE FROM users WHERE email LIKE ?', ['%@demonstraight.com'], () => resolve()); });
      await new Promise((resolve) => { db.run('DELETE FROM organisation_settings WHERE organisation_id IN (SELECT id FROM organisations WHERE slug = ?)', ['demon-straight'], () => resolve()); });
      await new Promise((resolve) => { db.run('DELETE FROM organisations WHERE slug = ?', ['demon-straight'], () => resolve()); });
      const uploadsDir = path.join(__dirname, UPLOADS_DIR);
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) { if (!file.startsWith('demo-')) { try { fs.unlinkSync(path.join(uploadsDir, file)); } catch (err) { log(`[DEMO MODE] Warning: Could not delete ${file}`, err.message); } } }
      }
      await seedDemoData();
      log('[DEMO MODE] Reset complete. Fresh demo data restored.');
    } catch (error) { console.error('[DEMO MODE] Reset failed:', error); log('[DEMO MODE] Reset failed', error.message); }
  }, resetInterval);
  log(`[DEMO MODE] Hourly reset timer started (${resetInterval / 1000 / 60} minutes)`);
}

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    const migrateEnv = IS_DEMO_MODE ? 'demo' : 'dev';
    execSync(`npx db-migrate up --env ${migrateEnv}`, { stdio: 'inherit', cwd: __dirname });
    console.log('Database migrations completed successfully');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const tablesExist = await new Promise((resolve) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) { console.error('Error checking tables:', err.message); resolve(false); }
        else { const tableNames = tables.map(t => t.name); console.log('Tables found:', tableNames); resolve(tableNames.includes('organisations') && tableNames.includes('users')); }
      });
    });
    if (!tablesExist) { console.error('ERROR: Database tables were not created by migrations'); process.exit(1); }
    if (IS_DEMO_MODE) { await seedDemoData(); startDemoResetTimer(); }
    try { backfillShortCodes(); } catch (err) { if (err.code !== 'SQLITE_ERROR') throw err; }
  } catch (error) { console.error('Migration failed:', error.message); process.exit(1); }
}

(async () => {
  try {
    await runMigrations();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      if (NODE_ENV === 'production') console.log('HTTPS enforcement and security features enabled');
    });
    function gracefulShutdown(signal) {
      console.log(`\n${signal} received. Closing database connection and shutting down gracefully...`);
      db.close((err) => {
        if (err) console.error('Error closing database:', err.message);
        else console.log('Database connection closed.');
        server.close(() => { console.log('Server closed.'); process.exit(0); });
        setTimeout(() => { console.error('Forced shutdown after timeout'); process.exit(1); }, 10000);
      });
    }
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) { console.error('Failed to start server:', error); process.exit(1); }
})();