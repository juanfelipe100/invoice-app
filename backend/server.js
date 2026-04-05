const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

app.use(cors({
  origin: process.env.FRONTEND_URL || [
    'http://produccion.localhost:5173',
    'https://beautiful-chaja-e7fcff.netlify.app',
  ],
}));
app.use(express.json());

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
});

// ─── Customer Routes ──────────────────────────────────────────────────────────

app.post('/api/terms', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const submissionId = db.createSubmission(name.trim(), email.trim());
  res.json({ submissionId });
});

app.post('/api/upload/:submissionId', upload.single('invoice'), (req, res) => {
  const { submissionId } = req.params;
  const file = req.file;
  const { company, consumption, cost } = req.body;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const submission = db.getSubmission(submissionId);
  if (!submission) {
    fs.unlinkSync(file.path);
    return res.status(404).json({ error: 'Submission not found' });
  }

  db.updateSubmission(submissionId, {
    file_name: file.originalname,
    file_path: file.path,
    company: company?.trim() || null,
    consumption: consumption?.trim() || null,
    cost: cost?.trim() || null,
    uploaded_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    data: {
      company: company?.trim() || null,
      consumption: consumption?.trim() || null,
      cost: cost?.trim() || null,
    },
  });
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

app.get('/api/admin/submissions', (req, res) => {
  res.json(db.getAllSubmissions());
});

app.delete('/api/admin/submissions/:id', (req, res) => {
  const removed = db.deleteSubmission(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Not found' });
  if (removed.file_path && fs.existsSync(removed.file_path)) {
    fs.unlinkSync(removed.file_path);
  }
  res.json({ success: true });
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 20 MB.' });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
