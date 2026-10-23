# Nido Zapopan Crm

Construye la segunda parte final del reto Blender.mx a partir del ZIP adjunto, que contiene el frontend Vue/Vite funcional de la parte 1 y todos sus activos reales. Migra la experiencia pública fielmente al stack nativo soportado por Lovable (TypeScript, React/TanStack o Vite según la plantilla, Tailwind y shadcn/ui). No intentes ejecutar Vue dentro de React: reutiliza el diseño, contenido, imágenes, fuentes, iconos y comportamiento como referencia y reimplementa los componentes correctamente.

OBJETIVO
Crear una sola aplicación Lovable publicada que incluya:
1) La landing pública del departamento en la ruta /.
2) Login de personal por correo y contraseña en /login.
3) CRM protegido de interesados en /interesados.
4) Lovable Cloud como única base de datos y autenticación de esta aplicación.
5) Un endpoint público seguro para que la landing Lovable y la landing existente https://blender-application.wacoding.org puedan registrar leads en la misma base.

DISEÑO A PRESERVAR
- Identidad arquitectónica editorial “NIDO Zapopan”.
- Paleta: tinta #14201D, agave #1F624C, agave oscuro #174B3B, cobre #D76621, blanco y líneas grises.
- Bodoni Moda para titulares, Manrope para UI y IBM Plex Mono para datos/medidas.
- Galería con imágenes reales incluidas, precio $3,450,000 MXN, Zapopan, 2 recámaras, 2 baños, 95 m², un estacionamiento, alberca y gimnasio.
- Navbar refinada, transiciones minimalistas, skeletons, loaders, estados vacíos y de error, responsive móvil/escritorio y reduced-motion.
- El formulario “Me interesa” conserva validación, feedback de envío y mensaje exacto “Gracias, te contactaremos pronto”.
- En móvil usa bottom sheet con botón de cierre y gesto de arrastre hacia abajo fluido, sin rebote.
- Mantén SEO, iconos, manifest y metadatos de la landing.

LOVABLE CLOUD Y SEGURIDAD
Activa el backend integrado de Lovable.
Crea una tabla leads con:
- id uuid primary key
- created_at timestamptz default now()
- updated_at timestamptz
- name text requerido
- phone text requerido
- email text requerido
- status text requerido, default 'Nuevo', limitado a: 'Nuevo', 'Contactado', 'Le interesa', 'Descartado'
- note text requerido default ''
Incluye índices útiles para created_at y status.

Habilita RLS. Usuarios anónimos NO pueden hacer SELECT, UPDATE ni DELETE. Los usuarios autenticados pueden leer y actualizar leads. No hay eliminación desde la interfaz. La captura pública NO debe insertar directamente en la tabla: crea una Edge Function create-lead que use privilegios de servidor, acepte sólo POST JSON, valide y normalice name/phone/email, limite longitudes, rechace correos inválidos y campos extra, establezca siempre status='Nuevo' y note='', y devuelva JSON sin datos sensibles. Configura CORS sólo para el origen publicado por Lovable, previews necesarios y https://blender-application.wacoding.org. Nunca expongas service_role ni secretos en el frontend. Añade protección razonable contra abuso/rate limit si está disponible.

AUTENTICACIÓN
- Login con correo y contraseña.
- Ruta /interesados protegida; si no hay sesión redirige a /login.
- No muestres registro público. Todos los usuarios autenticados representan personal de ventas.
- Si Lovable Cloud permite deshabilitar signup público, déjalo deshabilitado; si requiere una acción manual, indícala claramente al terminar.
- Cerrar sesión.
- No filtres ni renderices datos antes de confirmar la sesión.

CRM
- Lista del más reciente al más antiguo.
- Cada fila/tarjeta muestra fecha, nombre, teléfono y correo.
- Selector inline de estado con los cuatro valores y actualización persistente.
- Campo de nota editable y persistente con botón Guardar o autosave claramente indicado.
- Botón WhatsApp que abre https://wa.me/ con sólo dígitos del teléfono y un mensaje breve prellenado; usa target seguro.
- Filtro por estado y buscador por nombre.
- Resumen superior con total por cada estado.
- Feedback de guardado, loaders, skeleton, error recuperable, vacío útil y diseño móvil excelente.
- Accesibilidad de teclado, labels, focus visible y contraste suficiente.

INTEGRACIÓN Y PRUEBAS
El formulario público de / debe llamar create-lead. Diseña el contrato para que después pueda conectarse también el frontend Vue existente sin secretos.
Prueba al menos: formulario inválido, alta válida, redirección de ruta protegida, login, orden descendente, cambio de estado, nota persistente y URL de WhatsApp.
Antes de dar por terminado, ejecuta build y pruebas, revisa RLS y corrige cualquier vulnerabilidad importante. No uses Django ni el PostgreSQL del servidor del usuario. No inventes datos personales reales.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nido-zapopan-crm.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/65f11c62-5f1a-48fe-af81-5790b8468b8c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
