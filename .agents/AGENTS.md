# Contexto y Reglas de Trabajo: Club de Leones Quetzaltenango Admin

Este archivo contiene el contexto específico del proyecto y las instrucciones para el agente. Se carga automáticamente al abrir este espacio de trabajo.

## Contexto del Proyecto
- **Nombre:** Club de Leones Quetzaltenango Admin (Dashboard Administrativo)
- **Repositorio de GitHub:** [clubdeleones-ui/club-de-leones-quetzaltenango-admin](https://github.com/clubdeleones-ui/club-de-leones-quetzaltenango-admin)
- **Colaborador / Usuario de Push:** `pasaporteqr1` (configurado mediante Token de Acceso Personal en la URL remota de git).
- **Stack:** React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + Firebase (Auth, Firestore, Storage) + react-router-dom 7.
- **Comandos:** `npm run dev` (servidor en puerto 3000), `npm run build` (compila a `dist/`), `npm run preview`.

## Despliegue a Producción

### Alojamiento
- **Alojamiento de Producción:** GitHub Pages (despliegue automático en cada push a la rama `main`).
- **Workflow:** `.github/workflows/deploy.yml` — instala deps, `npm run build` y publica el contenido de `dist/` (artifact `~/dist`) en GitHub Pages.
- **Dominio Personalizado:** `https://clubdeleonesquetzaltenango.org/` (fijado por `public/CNAME` + DNS en Hostinger). Mantener `public/CNAME` intacto al compilar o cambiar config.
- **Despliegue Continuo:** Todo cambio implementado y validado se envía a producción con `git push origin main`. El CNAME no debe agregarse jamás al `dist/` manualmente; lo copia Vite desde `public/`.

### Firebase
- **Proyecto:** `club-leones-quetzaltenango` (ver `.firebaserc`).
- **Config de empaquetado:** `firebase.json` — hosting sobre `dist/`, redirects 301 a `https://clubdeleonesquetzaltenango.org/:path*`, headers de caché (`index.html` no-cache, `/assets/**` immutable 1 año), rewrite SPA `**` → `/index.html`.
- **Rules:** `firestore.rules` y `storage.rules` (desplegar con `firebase deploy --only firestore:rules,storage` cuando cambien).
- **Cuenta de Firebase CLI:** `clubdeleonesquetzaltenango@gmail.com` (ya autenticada en esta máquina). Verificar con `firebase login:list` solo ante errores de autenticación.
- **Config del SDK:** `services/firebase.ts` con valores por defecto incrustados (projectId `club-leones-quetzaltenango`). Las variables `VITE_FIREBASE_*` del `.env` tienen prioridad si existen.
- **Roles/Auth:** Firebase Auth soporta Google OAuth. Dominios autorizados de producción: `clubdeleonesquetzaltenango.org` y `www.clubdeleonesquetzaltenango.org`.

### Variables de Entorno
- `config/env.ts` lee (con fallbacks): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_GEMINI_API_KEY`, `VITE_GOOGLE_CLIENT_ID`, `VITE_RECURRENTE_TEST_KEY`, `VITE_RECURRENTE_LIVE_KEY`, `VITE_RECURRENTE_TEST_MODE`.
- `VITE_GEMINI_API_KEY` además se `define` en `vite.config.ts` como `process.env.GEMINI_API_KEY`.
- **No** existe `.env` en el repo (gitignored `*.local`); los fallbacks hardcodeados cubren producción.

## Reglas para el Agente
1. **Evitar Doble Verificación de GitHub:** La colaboración de `pasaporteqr1` y los permisos de escritura ya han sido validados. No ejecutes comandos de verificación de Git/GitHub a menos que falle un push.
2. **Sesión de Firebase CLI:** Antes de realizar operaciones de base de datos o almacenamiento en Firebase, asume que la sesión activa es `clubdeleonesquetzaltenango@gmail.com`. Verifica con `firebase login:list` silenciosamente solo si se encuentra un error de autenticación.
3. **Dominio CNAME:** El dominio personalizado está fijado a través del archivo `public/CNAME`. Si realizas compilaciones o cambios en archivos de configuración, asegúrate de mantener este archivo intacto.
4. **OAuth y Dominios Autorizados:** Si configuras nuevas rutas o integraciones, recuerda que `clubdeleonesquetzaltenango.org` y `www.clubdeleonesquetzaltenango.org` son los dominios autorizados de producción para Google OAuth y Firebase Auth.
5. **Despliegue Continuo a Producción:** Cada cambio implementado y validado debe ser enviado a producción (`git push origin main`), activando el flujo automatizado de despliegue en GitHub Pages hacia `https://clubdeleonesquetzaltenango.org/`.
6. **Verificación antes de push:** Ejecuta `npm run build` localmente antes de cada push para validar que la compilación genera `dist/` sin errores; el flujo de CI lo hará de nuevo en GitHub.
