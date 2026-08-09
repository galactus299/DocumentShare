import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { parseFileToTiptapJson } from './server/fileImport.js';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var module = { exports: {} };

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper to extract current user ID from cookie or x-user-id header
function getCurrentUserId(req: express.Request): string | undefined {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId && db.getUserById(headerUserId)) {
    return headerUserId;
  }
  const cookieUserId = req.cookies?.currentUserId;
  if (cookieUserId && db.getUserById(cookieUserId)) {
    return cookieUserId;
  }
  return undefined;
}

// Fallback to default user if strictly required for legacy fallback routes
function getRequiredUserId(req: express.Request): string {
  const id = getCurrentUserId(req);
  return id || 'user_1';
}

// ================= API ROUTES =================

// Auth: Get current active user profile
app.get('/api/auth/me', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.json({ user: null });
  }
  const user = db.getUserById(userId);
  res.json({ user: user || null });
});

// Auth: Sign Up new account
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const newUser = db.createUser({ name, email, password, role });
    res.cookie('currentUserId', newUser.id, { httpOnly: false, path: '/' });
    res.status(201).json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create account' });
  }
});

// Auth: Log In existing account
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password credentials' });
  }

  res.cookie('currentUserId', user.id, { httpOnly: false, path: '/' });
  res.json({ success: true, user });
});

// Auth: Reset Password
app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  const success = db.resetPassword(email, newPassword);
  if (!success) {
    return res.status(404).json({ error: 'No account found with that email address' });
  }

  res.json({ success: true, message: 'Password reset successfully' });
});

// Auth: Log Out
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('currentUserId', { path: '/' });
  res.json({ success: true });
});

// Auth: Quick Switch active user (for rapid testing/demo)
app.post('/api/auth/switch', (req, res) => {
  const { userId } = req.body;
  if (!userId || !db.getUserById(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  res.cookie('currentUserId', userId, { httpOnly: false, path: '/' });
  const user = db.getUserById(userId);
  res.json({ success: true, user });
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json({ users: db.getUsers(), activeUserId: getCurrentUserId(req) || 'user_1' });
});

// Search users by query for sharing
app.get('/api/users/search', (req, res) => {
  const q = (req.query.q as string) || '';
  const currentUserId = getCurrentUserId(req);
  const users = db.searchUsers(q, currentUserId);
  res.json({ users });
});

// Get documents list for active logged-in user
app.get('/api/documents', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.json({ owned: [], shared: [] });
  }
  const docs = db.getDocumentsForUser(userId);
  res.json(docs);
});

// Get a single document by ID or public share token
app.get('/api/documents/:id', (req, res) => {
  const userId = getCurrentUserId(req);
  const token = req.query.token as string | undefined;
  const doc = db.getDocumentById(req.params.id, userId, token);
  if (!doc) {
    return res.status(403).json({ error: 'Access denied or document not found' });
  }
  res.json({ document: doc, currentUserId: userId || null });
});

// Create new document
app.post('/api/documents', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Please sign in to create documents' });
  }
  const { title, content } = req.body;
  const doc = db.createDocument(title || 'Untitled document', content, userId);
  res.status(201).json({ document: doc });
});

// Update document (title/content) - Autosave
app.patch('/api/documents/:id', (req, res) => {
  const userId = getCurrentUserId(req);
  const token = (req.query.token as string) || req.body.token;
  const { title, content } = req.body;
  const updated = db.updateDocument(req.params.id, userId, { title, content }, token);
  if (!updated) {
    return res.status(403).json({ error: 'Failed to update document. Unauthorized or read-only access.' });
  }
  res.json({ document: updated });
});

// Update Public Sharing Settings
app.post('/api/documents/:id/public-share', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { isPublic, publicAccessLevel } = req.body;
  const doc = db.updatePublicSharing(req.params.id, userId, {
    isPublic: !!isPublic,
    publicAccessLevel: publicAccessLevel === 'edit' ? 'edit' : 'view',
  });
  if (!doc) {
    return res.status(403).json({ error: 'Only the document owner can configure public sharing.' });
  }
  res.json({ success: true, document: doc });
});

// Share document with specific registered user
app.post('/api/documents/:id/share', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required' });
  }
  const success = db.shareDocument(req.params.id, userId, targetUserId);
  if (!success) {
    return res.status(403).json({ error: 'Failed to share document. Must be document owner.' });
  }
  const updatedDoc = db.getDocumentById(req.params.id, userId);
  res.json({ success: true, document: updatedDoc });
});

// Share document by Email (find or create user)
app.post('/api/documents/:id/share-email', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email address is required' });
  }

  let targetUser = db.getUserByEmail(email);
  if (!targetUser) {
    // Create guest/invited user account automatically
    const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    targetUser = db.createUser({
      name: formattedName,
      email: email,
      role: 'Collaborator',
    });
  }

  const success = db.shareDocument(req.params.id, userId, targetUser.id);
  if (!success) {
    return res.status(403).json({ error: 'Failed to share document. Must be document owner.' });
  }

  const updatedDoc = db.getDocumentById(req.params.id, userId);
  res.json({ success: true, document: updatedDoc, sharedUser: targetUser });
});

// Unshare document
app.post('/api/documents/:id/unshare', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required' });
  }
  const success = db.unshareDocument(req.params.id, userId, targetUserId);
  if (!success) {
    return res.status(403).json({ error: 'Failed to unshare document.' });
  }
  const updatedDoc = db.getDocumentById(req.params.id, userId);
  res.json({ success: true, document: updatedDoc });
});

// Delete document (owner only)
app.delete('/api/documents/:id', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const success = db.deleteDocument(req.params.id, userId);
  if (!success) {
    return res.status(403).json({ error: 'Failed to delete. Only owner can delete.' });
  }
  res.json({ success: true });
});

// File upload / import route
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = getRequiredUserId(req);
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const { title, content } = await parseFileToTiptapJson(buffer, originalname, mimetype);

    const newDoc = db.createDocument(title, content, userId);
    res.status(201).json({ success: true, document: newDoc });
  } catch (err: any) {
    console.error('Upload processing error:', err);
    res.status(400).json({ error: err.message || 'Failed to parse uploaded file' });
  }
});

// ================= VITE / STATIC MIDDLEWARE =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Collaborative Document Editor Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // Allow express app export for serverless handlers
}

startServer();

export default app;
