# Guía de Arquitectura de Layout y Contenedores Responsive

Este documento establece la norma oficial y de referencia para la relación de márgenes, anchos y contenedores en todas las vistas públicas y administrativas del **Club de Leones Quetzaltenango**.

---

## 1. La Regla de Oro: Evitar Cajas Anidadas («Márgenes Acumulados»)

El problema más crítico en el diseño para dispositivos móviles es la **pérdida de ancho útil por acumulación accidental de márgenes**:

```
[Viewport Móvil (p. ej. 375px)]
└── <main> (10px padding izq/der)             -> Quedan 355px
    └── <section> (8px padding izq/der)       -> Quedan 339px
        └── .card-exterior (16px padding)     -> Quedan 307px
            └── .card-interior (16px padding) -> Quedan 275px (¡Se perdió el 27% de la pantalla!)
```

### Principio Fundamental:
> **En dispositivos móviles, el lienzo exterior o contenedor raíz debe ser *Full-Bleed* (tocar los bordes físicos al 100% de la pantalla, `0px` de margen en `<main>`), y los elementos de contenido (tarjetas o secciones) deben flotar directamente sobre él utilizando el ancho máximo disponible.**

---

## 2. Tipología de Páginas del Proyecto

| Tipo de Página | Ejemplos | Comportamiento del `<main>` | Ancho Máximo en Desktop |
| :--- | :--- | :--- | :--- |
| **Landings Públicas de Impacto** | `/convencion`, `/historia`, `/galeria`, `/` | `w-full max-w-none px-0 py-0` (*Full-Bleed*) | Secciones internas topan en `max-w-[1440px]` con márgenes automáticos. |
| **Consola / Tablas Administrativas** | `/dashboard`, `/socios`, `/admin`, `/cuotas` | `max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6` | Contenedor centrado para evitar tablas excesivamente anchas. |

---

## 3. Especificación Técnica de Breakpoints y Clases

### A. Contenedores de Sección (`layout-section-landing`)

Aplica a cada sección vertical (`<section>` o `<div>`) dentro de una landing pública:

```html
<!-- Estructura estándar recomendada -->
<section className="my-8 sm:my-16 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8">
  <!-- Encabezado de Sección (directo sobre el lienzo claro) -->
  <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-3">
    <span className="badge-pill">Categoría</span>
    <h2 className="text-3xl sm:text-5xl font-black text-slate-900">Título de Sección</h2>
    <p className="text-slate-600 text-sm sm:text-base">Descripción de apoyo</p>
  </div>

  <!-- Rejilla de Tarjetas Flotantes -->
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
    <div className="card-floating-navy">...</div>
    <div className="card-floating-navy">...</div>
    <div className="card-floating-navy">...</div>
  </div>
</section>
```

| Breakpoint | Pantalla | Padding Lateral de Sección | Espaciado entre Tarjetas (`gap`) |
| :--- | :--- | :--- | :--- |
| **Móvil (`< 640px`)** | 360px – 428px | `px-2` (8px a cada lado) | `gap-4` o `gap-5` |
| **Tablet (`sm`, `md`)** | 640px – 1023px | `px-6` (24px a cada lado) | `gap-6` |
| **Desktop (`lg`, `xl`)** | $\ge$ 1024px | `px-8` (32px a cada lado) | `gap-8` |

---

### B. Tarjetas Flotantes (`card-floating-navy`)

En lugar de envolver la sección en una caja azul gigantesca, cada elemento interior es una **tarjeta independiente flotante**:

```html
<div className="bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#060e1d] text-white border border-yellow-500/30 hover:border-yellow-400 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/15 transition-all duration-300 hover:-translate-y-1">
  <!-- Contenido de la tarjeta -->
</div>
```

#### Ventajas:
1. **En Móvil:** La tarjeta se expande al ancho máximo de la pantalla, dejando solo un margen estético de 8px a los lados para que la sombra y el borde dorado se aprecien con nitidez.
2. **En Desktop:** El grid distribuye las tarjetas en 2 o 3 columnas con espaciado uniforme y efecto de elevación (*hover transform*).

---

## 4. Configuración en `components/Layout.tsx`

El componente `Layout` detecta automáticamente si la ruta actual es una página que requiere despliegue completo de borde a borde (*Full-Bleed*):

```tsx
// components/Layout.tsx
const isFullBleedRoute = ['/convencion'].includes(location.pathname);

<main className={`flex-grow w-full ${isFullBleedRoute ? 'max-w-none px-0 py-0' : 'max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-10'}`}>
  {children}
</main>
```

> **Para agregar una nueva página full-bleed en el futuro:**
> Basta con agregar la ruta al arreglo `isFullBleedRoute` (por ejemplo: `['/convencion', '/nueva-landing'].includes(location.pathname)`).

---

## 5. Checklist de Verificación para Nuevas Vistas

Antes de dar por concluida una página o sección, verificar:

- [ ] ¿En resolución móvil (390px) el lienzo de fondo llega hasta los bordes de la pantalla sin cortes?
- [ ] ¿Los botones e inputs de formularios tienen espacio suficiente y no están apretados?
- [ ] ¿Se eliminaron contenedores envolventes redundantes que tenían el mismo color de fondo que las tarjetas?
- [ ] ¿En pantallas grandes (1440px o más) la página mantiene un límite centrado (`max-w-[1440px] mx-auto`) sin estirarse indefinidamente?
- [ ] ¿El texto sobre el fondo claro tiene alto contraste (`text-slate-900` para títulos, `text-slate-600` para párrafos) y el texto dentro de las tarjetas azules es `text-white` y `text-yellow-400`?
