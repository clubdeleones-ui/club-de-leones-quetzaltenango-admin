# Contexto y Reglas de Trabajo: Club de Leones Quetzaltenango Admin

Este archivo contiene el contexto específico del proyecto y las instrucciones para el agente Antigravity. Se carga automáticamente al abrir este espacio de trabajo.

## Contexto del Proyecto
- **Nombre:** Club de Leones Quetzaltenango Admin (Dashboard Administrativo)
- **Repositorio de GitHub:** [clubdeleones-ui/club-de-leones-quetzaltenango-admin](https://github.com/clubdeleones-ui/club-de-leones-quetzaltenango-admin)
- **Colaborador / Usuario de Push:** `pasaporteqr1` (configurado mediante Token de Acceso Personal en la URL remota de git).
- **Alojamiento de Producción:** GitHub Pages (despliegues automáticos en cada push a la rama `main`).
- **Dominio Personalizado:** `https://clubdeleonesquetzaltenango.org/` (configurado mediante el archivo `public/CNAME` y DNS en Hostinger).
- **Proyecto de Firebase:** `club-leones-quetzaltenango`
- **Cuenta de Firebase CLI:** `clubdeleonesquetzaltenango@gmail.com` (ya autenticada en esta máquina).

## Reglas para el Agente (Antigravity)
1. **Evitar Doble Verificación de GitHub:** La colaboración de `pasaporteqr1` y los permisos de escritura ya han sido validados. No ejecutes comandos de verificación de Git/GitHub a menos que falle un push.
2. **Sesión de Firebase CLI:** Antes de realizar operaciones de base de datos o almacenamiento en Firebase, asume que la sesión activa es `clubdeleonesquetzaltenango@gmail.com`. Verifica con `firebase login:list` silenciosamente solo si se encuentra un error de autenticación.
3. **Dominio CNAME:** El dominio personalizado está fijado a través del archivo `public/CNAME`. Si realizas compilaciones o cambios en archivos de configuración, asegúrate de mantener este archivo intacto.
4. **OAuth y Dominios Autorizados:** Si configuras nuevas rutas o integraciones, recuerda que `clubdeleonesquetzaltenango.org` y `www.clubdeleonesquetzaltenango.org` son los dominios autorizados de producción para Google OAuth y Firebase Auth.
