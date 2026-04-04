const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

function load() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  return { nextId: 1, submissions: [] };
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const db = {
  createSubmission(name, email) {
    const data = load();
    const submission = {
      id: data.nextId++,
      customer_name: name,
      customer_email: email,
      terms_accepted_at: new Date().toISOString(),
      file_name: null,
      file_path: null,
      company: null,
      consumption: null,
      cost: null,
      uploaded_at: null,
      created_at: new Date().toISOString(),
    };
    data.submissions.push(submission);
    save(data);
    return submission.id;
  },

  getSubmission(id) {
    const { submissions } = load();
    return submissions.find((s) => s.id === Number(id)) || null;
  },

  updateSubmission(id, fields) {
    const data = load();
    const idx = data.submissions.findIndex((s) => s.id === Number(id));
    if (idx === -1) return false;
    Object.assign(data.submissions[idx], fields);
    save(data);
    return true;
  },

  getAllSubmissions() {
    const { submissions } = load();
    return [...submissions].reverse(); // newest first
  },

  deleteSubmission(id) {
    const data = load();
    const idx = data.submissions.findIndex((s) => s.id === Number(id));
    if (idx === -1) return null;
    const [removed] = data.submissions.splice(idx, 1);
    save(data);
    return removed;
  },
};

module.exports = { db };
