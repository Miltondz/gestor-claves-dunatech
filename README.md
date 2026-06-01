# Vaultly — Gestor de Credenciales (by DunaTech)

[![Vaultly Screenshot](./screenshots/dunatech_gestor_claves_completo.png)](https://w7n2powvrmo0.space.minimax.io)

> **Aplicación web moderna para gestionar de forma segura tus credenciales, contraseñas y API keys localmente, sin servidores externos.**

## Características

- **100% Local** — Tus datos se almacenan solo en `localStorage`. Nunca salen de tu dispositivo.
- **Diseño Vaultly** — Interfaz oscura con sidebar, grid de tarjetas pastel, filtros por categoría, ordenamiento y modales glass.
- **Categorías** — Personal, Trabajo, Finanzas, Social, Otro. Filtra desde la barra lateral, chips en escritorio o nav inferior en móvil.
- **Ordenamiento** — Por nombre (A-Z, Z-A) o fecha de creación (reciente, antiguo).
- **Búsqueda en tiempo real** — Filtra cuentas al instante con resaltado de coincidencias. Atajos de teclado: `/` o `Ctrl+K` para buscar, `Esc` para limpiar.
- **Campos dinámicos** — Correo, contraseña, nombre, enlace. Añade tantos como necesites.
- **Contraseñas ocultas** — Se muestran como `••••••••` por defecto. Botón para mostrar/ocultar en el modal de detalles.
- **Copia con un clic** — Cada campo tiene su botón de copia con feedback visual.
- **Deshacer eliminación** — Las cuentas eliminadas se recuperan durante 5 segundos vía toast inferior.
- **Backup / Importar** — Descarga un JSON con todas tus cuentas y restáuralo después.
- **PWA (Progressive Web App)** — Service worker que cachea los archivos para funcionar sin conexión (los assets locales; los CDNs requieren internet).
- **Diseño responsive** — Layout adaptativo con sidebar (escritorio), top nav compacta (móvil) y nav inferior con acceso rápido a categorías.

## Demo en Vivo

**[👉 Ver Aplicación](https://w7n2powvrmo0.space.minimax.io)**

## Capturas de Pantalla

![Vaultly Screenshot](./screenshots/dunatech_gestor_claves_completo.png)

## Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript habilitado
- Soporte para LocalStorage
- **Conexión a internet en la primera carga** (Tailwind CSS, Google Fonts y Material Symbols se cargan vía CDN)

### Instalación Local

```bash
git clone https://github.com/Miltondz/gestor-claves-dunatech.git
cd gestor-claves-dunatech
```

Abre con un servidor HTTP (necesario para `fetch()` de `data.json` y service worker):

```bash
python -m http.server 8000
npx http-server
php -S localhost:8000
```

Luego visita `http://localhost:8000`.

## Estructura del Proyecto

```
gestor-claves-dunatech/
├── index.html               # Página principal con Tailwind y layout Vaultly
├── style.css                # Animaciones, scrollbar y pequeños overrides
├── app.js                   # Lógica completa (CRUD, búsqueda, modales, validación)
├── data.json                # Datos demo (prefijo DEMO_)
├── sw.js                    # Service worker (PWA offline)
├── manifest.webmanifest     # Manifiesto PWA
├── icon.svg                 # Ícono de la app
├── LICENSE                  # MIT
├── screenshots/             # Capturas
└── README.md                # Este archivo
```

## Tecnologías

- **Tailwind CSS** vía CDN (Play CDN con plugins `forms` y `container-queries`)
- **Google Fonts**: Inter (texto) + JetBrains Mono (datos)
- **Material Symbols** (íconos)
- **Vanilla JS** (ES2017+, `"use strict"`, sin dependencias JS)

## Dependencias Externas (CDN)

| Recurso | URL |
|---|---|
| Tailwind CSS | `cdn.tailwindcss.com` |
| Google Fonts | `fonts.googleapis.com` |
| Material Symbols | `fonts.googleapis.com` |

Estas dependencias se cargan solo en la primera visita. Una vez cacheadas por el service worker, la app funciona sin conexión, aunque los estilos de Tailwind no se regenerarán sin red.

## Funcionalidades

### Gestión de Cuentas
- **Añadir** — Botón "Nueva" o tarjeta "Crear Nueva Entrada" al final del grid.
- **Editar** — Botón de edición en cada tarjeta o desde el modal de detalles.
- **Duplicar** — Crea una copia con "(copia)" en la descripción.
- **Eliminar** — Eliminación suave con deshacer de 5 segundos.

### Búsqueda y Filtros
- **Barra de búsqueda** — Filtra por descripción o cualquier campo. Resalta coincidencias.
- **Categorías** — Sidebar, chips en escritorio y nav inferior en móvil.
- **Ordenamiento** — Nombre (A-Z, Z-A) o fecha de creación.

### Seguridad
- **Almacenamiento local** — Los datos nunca salen del navegador, no hay servidor.
- **Contraseñas ocultas** — Se muestran como `••••••••` en las tarjetas y se pueden ocultar/mostrar en el modal de detalles.
- **Validación de importes** — Los archivos JSON se validan: campos desconocidos se descartan, items mal formados se omiten.

> ⚠️ **Aviso**: Los datos en `localStorage` se guardan en **texto plano**. Extensiones del navegador o scripts con acceso a la página (XSS) pueden leerlos. Para secretos de alta sensibilidad considera una solución con cifrado.

## Licencia

MIT. Ver [`LICENSE`](./LICENSE).

## Contacto

**DunaTech** — Desarrollador: Milton  
**GitHub:** [@Miltondz](https://github.com/Miltondz)  
**Proyecto:** [gestor-claves-dunatech](https://github.com/Miltondz/gestor-claves-dunatech)

---

**© 2025-2026 DunaTech. Todos los derechos reservados.**

*Vaultly — Gestor de credenciales local, seguro y moderno.*
