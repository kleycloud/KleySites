// Subida directa a Cloudinary desde el navegador (preset sin firmar) —
// la usan tanto la foto de perfil (perfil.js) como el favicon del sitio
// (editor/ajustes.js). El backend nunca ve el archivo, solo la URL final.
const CLOUD_NAME = 'aup5guac';
const UPLOAD_PRESET = 'kleysites_uploads';

// `carpeta` organiza lo subido por cliente dentro de la misma cuenta de
// Cloudinary (p. ej. "clientes/42/perfil") — no es aislamiento de
// seguridad (cada archivo ya tiene una URL única e impredecible), es
// para poder ver/gestionar el almacenamiento de cada cliente por separado
// más adelante, en vez de tenerlo todo mezclado en una sola carpeta.
export async function subirACloudinary(archivo, carpeta) {
  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (carpeta) formData.append('folder', carpeta);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('No se pudo subir la imagen');
  const data = await res.json();
  return data.secure_url;
}
