const test = require('node:test');
const assert = require('node:assert/strict');
const { handleUpload } = require('../src/routes/upload');

test('handleUpload returns metadata for uploaded file', () => {
  const req = {
    body: {
      fileName: 'archivo.pdf',
      mimeType: 'application/pdf'
    }
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
    }
  };

  let nextCalled = false;
  handleUpload(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, false);
  assert.deepEqual(res.payload, {
    ok: true,
    message: 'Upload recibido',
    fileName: 'archivo.pdf',
    mimeType: 'application/pdf'
  });
});
