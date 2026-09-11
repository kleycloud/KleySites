import { NextResponse } from 'next/server';
import { ErrorAutenticacion } from './auth.js';

const ORIGIN = process.env.KLEYSITES_FRONTEND_ORIGIN || '*';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function json(data, init = {}) {
  return NextResponse.json(data, { ...init, headers: { ...CORS_HEADERS, ...(init.headers || {}) } });
}

export function error(status, mensaje) {
  return json({ error: mensaje }, { status });
}

// Envuelve un handler de ruta: autentica, atrapa errores de auth (401) y
// cualquier excepción no prevista (500) sin que se filtre el detalle interno.
export function conManejoDeErrores(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ErrorAutenticacion) return error(401, 'Sesión inválida o expirada.');
      console.error(e);
      return error(500, 'Error interno. Intenta de nuevo.');
    }
  };
}

export function opciones() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
