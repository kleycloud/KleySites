// Redes sociales del bloque "Redes": nombre visible + trazo del ícono.
// Lucide ya no incluye logos de marcas, así que son trazos propios
// simplificados, con el mismo criterio que iconos.js (cadenas fijas del
// código, nunca datos de usuario). La clave es lo que se guarda en
// contenido.items[].red.
export const REDES = {
  facebook: { nombre: 'Facebook', icono: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8a1 1 0 0 1 0 0z"/>' },
  instagram: { nombre: 'Instagram', icono: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>' },
  x: { nombre: 'X (Twitter)', icono: '<path d="M4 4l16 16M20 4 4 20"/>' },
  youtube: { nombre: 'YouTube', icono: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>' },
  tiktok: { nombre: 'TikTok', icono: '<path d="M14 3v11a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c0 3 2.5 5.5 5.5 5.5"/>' },
  linkedin: { nombre: 'LinkedIn', icono: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>' },
  whatsapp: { nombre: 'WhatsApp', icono: '<path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z"/>' },
  correo: { nombre: 'Correo', icono: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>' },
  web: { nombre: 'Sitio web', icono: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>' },
};
