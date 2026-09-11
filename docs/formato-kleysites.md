# Formato KleySites v1

Es el JSON que el editor exporta (`kleysites.json` dentro del ZIP) y que
acepta en **Importar**. Exportar → importar es sin pérdida. Sirve también
para pedirle a Claude (o a cualquier generador) una página que entre al
editor con todo editable — al final hay un prompt listo para pegar.

## Estructura

```json
{
  "version": 1,
  "sitio": { "nombre": "Mi tienda" },
  "paginas": [
    {
      "nombre": "Inicio",
      "zonas": {
        "encabezado": [ /* nodos */ ],
        "contenido":  [ /* nodos */ ],
        "pie":        [ /* nodos */ ]
      }
    }
  ]
}
```

Importar también acepta formas más cortas:

- `{ "zonas": { ... } }` — una sola página (va a la página actual).
- `[ nodo, nodo, ... ]` — una lista de nodos (va a la zona activa).

Con `paginas`, la que coincide por nombre con la página abierta (o la
primera) entra al lienzo; las demás se crean si no existen y se agregan.

## Nodo (bloque)

```json
{ "tipo": "titulo", "contenido": { "texto": "Hola", "nivel": "h1" }, "estilos": { "color": "#ffffff" }, "hijos": [] }
```

- `tipo` — obligatorio, uno de la tabla de abajo. Un tipo desconocido se descarta con sus hijos.
- `contenido` — depende del tipo (tabla).
- `estilos` — opcional, claves de la tabla de estilos. Las desconocidas se ignoran.
- `hijos` — solo tiene efecto en `seccion` y `columnas`.

## Tipos y su `contenido`

| tipo | contenido |
|---|---|
| `titulo` | `texto`, `nivel` (`h1`…`h6`) |
| `texto` | `html` (solo `b i u em strong a br p span ul ol li`; el resto se elimina) |
| `imagen` | `src`, `alt` |
| `boton` | `texto`, `href` |
| `video` | `src` |
| `icono` | `nombre` (`estrella corazon rayo casa telefono correo ubicacion reloj check flecha usuario carrito`), `tamano` (px) |
| `separador` | — |
| `espaciador` | `alto` (px) |
| `galeria` | `imagenes` (URLs separadas por salto de línea `\n`) |
| `formulario` | `titulo`, `boton` |
| `mapa` | `src` (URL de inserción de Google Maps) |
| `seccion` | — (contenedor vertical; usa `hijos`) |
| `columnas` | — (contenedor horizontal; usa `hijos`) |

## Estilos

Los números van sin unidad (se asumen px) salvo donde se indica. Los
`select` guardan la clave en español, nunca el valor CSS.

| Grupo | Claves | Valores |
|---|---|---|
| Tipografía | `fuente` | `Sora Inter Poppins Montserrat Roboto Lato Nunito "Playfair Display" Merriweather Lora "JetBrains Mono" Georgia Arial Verdana "Times New Roman" "Courier New"` |
| | `tamano` | número (px) |
| | `peso` | `normal medio semibold negrita extra` |
| | `interlineado` | número (ej. `1.5`) |
| | `espaciado_letras` | número (px) |
| | `transformacion` | `ninguna mayusculas minusculas capitalizar` |
| | `decoracion` | `ninguna subrayado tachado` |
| | `alineacion` | `izquierda centro derecha justificado` |
| | `color` | `#rrggbb` |
| Fondo | `fondo` | `#rrggbb` |
| | `fondo_imagen` | URL |
| | `fondo_ajuste` | `cubrir contener repetir` |
| Espaciado | `padding_arriba` `padding_derecha` `padding_abajo` `padding_izquierda` | número |
| | `margen_arriba` `margen_derecha` `margen_abajo` `margen_izquierda` | número |
| Borde | `borde` (grosor), `borde_estilo` (`solido punteado discontinuo`), `borde_color` | |
| | `radio`, `radio_sup_izq` `radio_sup_der` `radio_inf_der` `radio_inf_izq` | número |
| Efectos | `sombra` | `ninguna sutil media fuerte` |
| | `opacidad` | 0–100 |
| Tamaño | `ancho` `alto` `ancho_max` | número, `50%`, `auto` |
| Imagen | `ajuste` (`cubrir contener rellenar`), `filtro_brillo` `filtro_contraste` (0–200), `filtro_gris` (0–100), `filtro_desenfoque` (px) | |
| Botón | `ancho_completo` | `si` |
| Contenedor | `direccion` (`fila columna`), `columnas_n` (1–6), `gap`, `alinear_h` (`inicio centro fin espaciado`), `alinear_v` (`inicio centro fin estirar`) | |
| Galería | `galeria_columnas` (1–6), `galeria_gap`, `galeria_alto` | número |
| Video/Mapa | `proporcion` | `auto 16:9 4:3 1:1` |

## Prompt para Claude

> Genera una página web en **formato KleySites v1**: un único JSON con
> `{"version":1,"paginas":[{"nombre":"Inicio","zonas":{"encabezado":[],"contenido":[],"pie":[]}}]}`.
> Cada nodo es `{"tipo","contenido","estilos","hijos"}`. Tipos permitidos:
> titulo (texto, nivel h1-h6), texto (html con b/i/u/a/p/br/ul/ol/li), imagen
> (src, alt), boton (texto, href), video (src), icono (nombre, tamano),
> separador, espaciador (alto), galeria (imagenes con URLs separadas por \n),
> formulario (titulo, boton), mapa (src), seccion y columnas (contenedores,
> usan hijos). Estilos permitidos (números en px sin unidad, colores #rrggbb):
> fuente, tamano, peso (normal|medio|semibold|negrita|extra), interlineado,
> espaciado_letras, transformacion, alineacion (izquierda|centro|derecha),
> color, fondo, fondo_imagen, padding_arriba/derecha/abajo/izquierda,
> margen_*, borde, borde_estilo, borde_color, radio, sombra
> (sutil|media|fuerte), opacidad, ancho, alto, ancho_max, ajuste, direccion,
> columnas_n, gap, alinear_h, alinear_v, galeria_columnas, galeria_gap,
> proporcion. Pon el logo/menú en `encabezado`, la información legal y de
> contacto en `pie`. Responde solo con el JSON, sin explicaciones.
> La página es sobre: ___
