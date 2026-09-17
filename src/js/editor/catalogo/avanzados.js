/*
  catalogo/avanzados.js
  Bloques de las categorías "Avanzados", "Ecommerce" y "Extras". Mismo
  contrato que basicos.js. Las listas (características, preguntas, redes)
  se guardan como JSON string en una sola clave (ver render/lista.js) y
  se editan con el control "lista".
*/

import { REDES } from '../../render/iconos-redes.js';

const OPCIONES_RED = Object.entries(REDES).map(([id, r]) => [id, r.nombre]);

export const AVANZADOS = [
  {
    tipo: 'galeria', etiqueta: 'Galería', categoria: 'avanzados',
    icono: '<rect x="3" y="3" width="12" height="12" rx="2"/><rect x="9" y="9" width="12" height="12" rx="2"/>',
    contenidoInicial: { imagenes: '' },
    campos: [{ key: 'contenido.imagenes', label: 'Imágenes (una URL por línea)', type: 'textarea' }],
  },
  {
    tipo: 'formulario', etiqueta: 'Formulario', categoria: 'avanzados',
    icono: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/>',
    contenidoInicial: { titulo: 'Contáctanos', boton: 'Enviar' },
    campos: [
      { key: 'contenido.titulo', label: 'Título', type: 'text' },
      { key: 'contenido.boton', label: 'Texto del botón', type: 'text' },
    ],
  },
  {
    tipo: 'mapa', etiqueta: 'Mapa', categoria: 'avanzados',
    icono: '<path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/>',
    contenidoInicial: { src: '' },
    campos: [{ key: 'contenido.src', label: 'Mapa (URL de inserción de Google Maps)', type: 'text' }],
  },
  {
    tipo: 'testimonial', etiqueta: 'Testimonial', categoria: 'avanzados',
    icono: '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
    contenidoInicial: { texto: 'Excelente servicio, lo recomiendo.', autor: 'Nombre Apellido', cargo: 'Cliente', foto: '' },
    campos: [
      { key: 'contenido.texto', label: 'Opinión', type: 'textarea' },
      { key: 'contenido.autor', label: 'Nombre', type: 'text' },
      { key: 'contenido.cargo', label: 'Cargo o empresa', type: 'text' },
      { key: 'contenido.foto', label: 'Foto', control: 'imagen' },
    ],
  },
  {
    tipo: 'precio', etiqueta: 'Precio', categoria: 'avanzados',
    icono: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    contenidoInicial: {
      titulo: 'Plan básico', precio: '$9', periodo: '/mes', boton: 'Elegir', href: '#',
      caracteristicas: JSON.stringify([{ texto: 'Todo lo básico' }, { texto: 'Soporte por correo' }]),
    },
    campos: [
      { key: 'contenido.titulo', label: 'Nombre del plan', type: 'text' },
      { key: 'contenido.precio', label: 'Precio', type: 'text' },
      { key: 'contenido.periodo', label: 'Periodo', type: 'text', placeholder: '/mes' },
      { key: 'contenido.caracteristicas', label: 'Qué incluye', control: 'lista', columnas: [{ k: 'texto', label: 'Característica' }], agregar: 'Agregar característica' },
      { key: 'contenido.boton', label: 'Texto del botón', type: 'text' },
      { key: 'contenido.href', label: 'Enlace del botón', type: 'text' },
    ],
  },
  {
    tipo: 'faq', etiqueta: 'FAQ', categoria: 'avanzados',
    icono: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    contenidoInicial: { items: JSON.stringify([{ pregunta: '¿Cómo funciona?', respuesta: 'Escribe aquí la respuesta.' }]) },
    campos: [
      { key: 'contenido.items', label: 'Preguntas', control: 'lista', columnas: [{ k: 'pregunta', label: 'Pregunta' }, { k: 'respuesta', label: 'Respuesta', tipo: 'textarea' }], agregar: 'Agregar pregunta' },
    ],
  },
  {
    tipo: 'producto', etiqueta: 'Producto', categoria: 'ecommerce',
    icono: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
    contenidoInicial: { nombre: 'Producto', precio: '$25', imagen: '', descripcion: 'Descripción breve del producto.', boton: 'Comprar', href: '#' },
    campos: [
      { key: 'contenido.imagen', label: 'Foto', control: 'imagen' },
      { key: 'contenido.nombre', label: 'Nombre', type: 'text' },
      { key: 'contenido.descripcion', label: 'Descripción', type: 'textarea' },
      { key: 'contenido.precio', label: 'Precio', type: 'text' },
      { key: 'contenido.boton', label: 'Texto del botón', type: 'text' },
      { key: 'contenido.href', label: 'Enlace del botón', type: 'text' },
    ],
  },
  {
    tipo: 'redes', etiqueta: 'Redes sociales', categoria: 'extras',
    icono: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    contenidoInicial: { items: JSON.stringify([{ red: 'facebook', url: '' }, { red: 'instagram', url: '' }]), tamano: '24' },
    campos: [
      { key: 'contenido.items', label: 'Redes', control: 'lista', columnas: [{ k: 'red', label: 'Red', tipo: 'select', opciones: OPCIONES_RED }, { k: 'url', label: 'Enlace', placeholder: 'https://…' }], agregar: 'Agregar red' },
      { key: 'contenido.tamano', label: 'Tamaño de los íconos (px)', type: 'text' },
    ],
  },
  {
    tipo: 'html', etiqueta: 'Código HTML', categoria: 'extras',
    icono: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    contenidoInicial: { html: '' },
    campos: [{ key: 'contenido.html', label: 'Código HTML (sin scripts)', type: 'textarea' }],
  },
];
