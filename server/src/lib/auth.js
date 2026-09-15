import { SignJWT, jwtVerify } from 'jose';

export class ErrorAutenticacion extends Error {}

function secreto(env) {
  return new TextEncoder().encode(env.KLEYSITES_JWT_SECRET);
}

// Lee y valida el JWT del header Authorization: "Bearer <token>". Los
// tokens ya emitidos con jsonwebtoken (HS256, mismo secreto) siguen
// verificando bien acá — JWT es un formato estándar, no hace falta
// invalidar sesiones existentes.
export async function clienteDesdeContexto(c) {
  const auth = c.req.header('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) throw new ErrorAutenticacion('sin_token');
  try {
    const { payload } = await jwtVerify(token, secreto(c.env));
    return payload;
  } catch (e) {
    throw new ErrorAutenticacion('token_invalido');
  }
}

export async function firmarToken(env, payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secreto(env));
}
