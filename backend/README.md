# Backend (n8n)

`n8n-workflow.json` es la exportación completa del workflow de n8n que
implementa la API de KleySites (login, sitios, bloques). Antes vivía solo
como archivo suelto fuera del repo, sin historial ni forma de revertir un
cambio — ahora cada vez que se modifique el workflow en n8n, hay que
volver a exportarlo y reemplazar este archivo, para que quede en el
historial de git como cualquier otro cambio de código.

## Cómo actualizar este archivo

1. En n8n: abrir el workflow → menú (⋮) → **Download**.
2. Reemplazar `backend/n8n-workflow.json` con el archivo descargado.
3. Commit normal, describiendo qué endpoint o flujo cambió.

## Cómo restaurar un workflow desde este archivo

1. En n8n: **Import from File** → seleccionar `n8n-workflow.json`.
2. Los nodos Postgres necesitan que se les asigne la credencial de Neon
   manualmente después de importar — n8n no exporta credenciales, así que
   estos nodos llegan con un id de credencial vacío/inválido.

## Convenciones del workflow

- Autenticación: JWT firmado con `$env.KLEYSITES_JWT_SECRET`, expira en 7
  días. Se valida leyendo `Authorization: Bearer <token>` del header.
- Cada recurso (`kleysites/sites`, `kleysites/blocks`, etc.) reutiliza la
  misma ruta para varios métodos HTTP: POST crea/guarda, GET lista, DELETE
  elimina.
- Las credenciales (Neon, Google OAuth) se referencian por id de
  credencial de n8n, nunca como texto plano en los nodos — este archivo es
  seguro de tener en un repositorio con historial, pero de todos modos
  conviene revisarlo antes de cada commit si se pega algo nuevo desde n8n.
