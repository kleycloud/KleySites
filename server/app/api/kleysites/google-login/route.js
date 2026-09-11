import { consultar } from '../../../../lib/db.js';
import { firmarToken } from '../../../../lib/auth.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;

export const POST = conManejoDeErrores(async (req) => {
  const body = await req.json();
  const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.id_token || '')}`);
  const info = await resp.json();

  if (!info.email || info.aud !== process.env.GOOGLE_CLIENT_ID_WEB || info.email_verified !== 'true') {
    return error(401, 'Token de Google inválido.');
  }

  const { rows } = await consultar('SELECT id FROM clients WHERE email = $1 LIMIT 1', [info.email]);
  let clientId = rows[0]?.id;

  if (!clientId) {
    const creado = await consultar(
      'INSERT INTO clients (email, password_hash, verified) VALUES ($1, NULL, true) RETURNING id',
      [info.email]
    );
    clientId = creado.rows[0].id;
  }

  const token = firmarToken({ client_id: clientId });
  return json({ token, client_id: clientId });
});
