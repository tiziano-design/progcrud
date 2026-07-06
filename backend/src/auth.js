const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'gimnasio-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Función para crear un token JWT
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// valida el token y verifica si el usuario tiene el rol permitido para acceder a la ruta
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado.' });
    }

    try {
      const decoded = verifyToken(token);
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
      }
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
  };
}

module.exports = {
  createToken,
  verifyToken,
  hashPassword,
  comparePassword,
  requireRole,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
