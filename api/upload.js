import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const form = formidable();
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'File processing failed' });
    }
    let file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // formidable v3+ returns files as arrays
    if (Array.isArray(file)) {
      file = file[0];
    }
    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'File processing failed' });
    }
    fs.readFile(file.filepath, 'utf8', (err, content) => {
      if (err) {
        return res.status(400).json({ error: 'File processing failed' });
      }
      res.json({ content, filename: file.originalFilename });
    });
  });
}
