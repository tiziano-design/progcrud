const test = require('node:test');
const assert = require('node:assert/strict');
const { createToken, verifyToken, hashPassword, comparePassword } = require('../src/auth');

test('createToken and verifyToken work with a payload', () => {
  const token = createToken({ sub: 1, role: 'admin' });

  assert.ok(token);

  const decoded = verifyToken(token);
  assert.equal(decoded.sub, 1);
  assert.equal(decoded.role, 'admin');
});

test('hashPassword and comparePassword validate a password', async () => {
  const hashedPassword = await hashPassword('secret123');

  assert.notEqual(hashedPassword, 'secret123');

  const isValid = await comparePassword('secret123', hashedPassword);
  assert.equal(isValid, true);
});
