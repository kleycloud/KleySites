-- Migración para pasar de n8n a este backend. Pensada para correr sobre
-- la misma base Neon que ya usa producción — revisar cada bloque antes
-- de correrlo si algo no coincide con lo que ya existe ahí.

-- clients: nueva columna para el límite de plan (gratis = 1 sitio) y avatar.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url text;

-- sites: favicon por sitio (Ajustes > favicon).
ALTER TABLE sites ADD COLUMN IF NOT EXISTS favicon_url text;

-- pages: nueva tabla — los bloques ahora cuelgan de una página, no
-- directo del sitio (ver src/js/editor/paginas.js en el frontend).
CREATE TABLE IF NOT EXISTS pages (
  id serial PRIMARY KEY,
  site_id integer NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- blocks: agregar page_id. Si la tabla actual tiene site_id en vez de
-- page_id (esquema previo a "páginas por sitio"), migrar los datos:
--   1. Crear una página "Inicio" por cada sitio existente.
--   2. UPDATE blocks SET page_id = <id de esa página> WHERE site_id = <ese sitio>.
--   3. Recién ahí volver page_id NOT NULL y borrar la columna site_id vieja.
-- Se deja como ALTER simple porque no hay forma de saber desde acá si
-- blocks ya tiene datos reales que migrar o está vacía.
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS page_id integer REFERENCES pages(id) ON DELETE CASCADE;
