import jwt from 'jsonwebtoken';

export class ErrorAutenticacion extends Error {}

// Lee y valida el JWT del header Authorization. Misma convención que el
// workflow de n8n que reemplaza: "Bearer <token>", firmado con
// KLEYSITES_JWT_SECRET, payload { client_id, email? }.
export function clienteDesdeRequest(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) throw new ErrorAutenticacion('sin_token');
  try {
    return jwt.verify(token, process.env.KLEYSITES_JWT_SECRET);
  } catch (e) {
    throw new ErrorAutenticacion('token_invalido');
  }
}

export function firmarToken(payload) {
  return jwt.sign(payload, process.env.KLEYSITES_JWT_SECRET, { expiresIn: '7d' });
}
