const express = require('express');
const router = express.Router();

function handleUpload(req, res, next) {
  const { fileName, mimeType } = req.body || {};

  if (!fileName) {
    return res.status(400).json({ ok: false, message: 'El nombre del archivo es obligatorio.' });
  }

  res.status(200).json({
    ok: true,
    message: 'Upload recibido',
    fileName,
    mimeType: mimeType || 'application/octet-stream'
  });
}

router.post('/', handleUpload);

module.exports = {
  router,
  handleUpload
};
