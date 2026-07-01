# 00_MASTER_PLAN_QUINTANA.md

# Proyecto

## Quintana CABA Propiedades

Versión: 0.2
Fecha: 2025-06-30

------------------------------------------------------------------------

# Visión

Construir una inmobiliaria moderna donde la tecnología, la atención personalizada y el conocimiento del mercado generen una ventaja competitiva sostenible.

La tecnología no reemplaza a las personas: potencia su trabajo.

La marca **Quintana CABA Propiedades** es la protagonista de toda comunicación pública. Cada persona del equipo (Carina, Claudia, Jorge) aporta valor desde su rol, pero la marca institucional debe permanecer por encima de cualquier nombre individual.

------------------------------------------------------------------------

# Roles

## Carina

- Directora y referente institucional de Quintana CABA Propiedades.
- Lidera la estrategia comercial y la imagen de la marca.
- Representa a la empresa en comunicación pública y decisiones estratégicas.
- Referente de confianza para propietarios y compradores.

## Claudia

- Asesora inmobiliaria clave del equipo.
- Captación de propiedades.
- Atención de compradores y vendedores.
- Seguimiento comercial.
- Desarrollo progresivo de cartera propia dentro del respaldo de Quintana.
- Su visibilidad pública debe crecer de forma natural, sin desplazar la imagen institucional de Carina.

## Jorge

- Tecnología, IA y automatización.
- Marketing digital y analítica.
- Mejora continua del sitio, procesos y herramientas internas.
- Responsable de que la tecnología sirva a los objetivos comerciales de Quintana.

------------------------------------------------------------------------

# Principios

1. **La marca siempre está por encima de las personas.** Toda comunicación pública fortalece a Quintana CABA Propiedades como marca/equipo.
2. **Toda mejora debe fortalecer a Quintana CABA Propiedades.** No se implementan funcionalidades que no aporten valor comercial o institucional.
3. **El crecimiento profesional de Claudia debe surgir como consecuencia del crecimiento de la empresa.** Claudia se posiciona como asesora clave dentro del equipo, nunca como reemplazo de Carina.
4. **Toda decisión debe aportar valor al cliente.** Cliente = propietario, comprador, inquilino o inversor.
5. **Medir antes de decidir.** Se prioriza lo que se puede medir: leads, tasaciones, captaciones, visitas, conversiones.
6. **Privacidad y permisos.** No se publican fotos, nombres, datos personales o historias de personas sin autorización explícita.
7. **Seguridad por defecto.** Secrets, credenciales y datos sensibles nunca se suben a GitHub.

------------------------------------------------------------------------

# Objetivos 2026-2027

## Comerciales

- Incrementar la captación de propiedades en Capital Federal.
- Mejorar la conversión de consultas a visitas y operaciones.
- Reducir tiempos de respuesta a leads.
- Fortalecer la reputación digital de Quintana.
- Posicionar a Quintana como referente de tasación y venta en CABA.

## Tecnológicos

- CRM inmobiliario liviano para seguimiento de leads.
- Automatización de publicaciones y contenido.
- IA para generación de contenido, redacción y asistencia comercial.
- Dashboard comercial con métricas de conversión.
- Base histórica del mercado para inteligencia de precios.

------------------------------------------------------------------------

# Roadmap

## Fase 1 — Auditoría y documentación

- Documentar visión, roles y decisiones fundamentales (ADR-001, GOV-001).
- Revisar estado actual del sitio y captación.
- Definir QA checklist antes de deploy.

## Fase 2 — Optimización del sitio

- Landing principal orientada a captar propietarios.
- Página de tasación (`/tasacion`).
- SEO local y estructura de URLs.
- UX: navegación, CTAs, mobile first.

## Fase 3 — Captación de propietarios

- Formulario de tasación funcional.
- Tracking de leads y clicks a WhatsApp.
- Sección institucional de equipo.
- Casos de éxito y testimonios (con autorización).

## Fase 4 — Automatización

- Pipeline de scraping, redacción y fotos.
- Publicación automática en Instagram (con credenciales de Meta).
- Dashboard de admin con métricas.

## Fase 5 — Observatorio del mercado inmobiliario

- Histórico diario de propiedades.
- Métricas de precio por m², liquidez y tiempo de venta.
- Recomendador de precios basado en datos propios.

------------------------------------------------------------------------

# KPIs

- Leads mensuales.
- Tasaciones solicitadas.
- Propiedades captadas.
- Tiempo medio de respuesta.
- Conversión a visitas.
- Conversión a operaciones.
- Tráfico orgánico.
- Posición SEO por keywords locales.
- Consultas por WhatsApp.
- Score de calidad de publicaciones.

------------------------------------------------------------------------

# Primer Backlog

## EPIC 1 — Captación de propietarios

- Landing principal orientada a captación.
- Página `/tasacion` con formulario.
- CTA de WhatsApp con mensaje de tasación.
- Sección institucional de equipo.
- Casos de éxito (con autorización).

## EPIC 2 — SEO local

- Optimización técnica.
- Blog o guías de barrios.
- Páginas por barrio o zona de CABA.
- Guías de tasación, venta y alquiler.

## EPIC 3 — CRM

- Captura de leads.
- Seguimiento de oportunidades.
- Agenda y recordatorios.
- Reportes de conversión.

## EPIC 4 — IA y automatización

- Redacción automática de descripciones.
- Clasificación y orden de fotos.
- Asistencia para respuestas de consultas.
- Publicaciones en redes sociales.

## EPIC 5 — Inteligencia de mercado

- Precio por m².
- Tiempo de venta estimado.
- Índice de liquidez por barrio.
- Recomendador de precio de publicación.

------------------------------------------------------------------------

# Regla de oro

Antes de desarrollar una nueva funcionalidad responder:

> "¿Esto ayuda a conseguir más propiedades o cerrar más operaciones?"

Si la respuesta es no, se posterga.

------------------------------------------------------------------------

# Notas para IA y desarrolladores

- Este documento es el primer punto de lectura antes de tocar código.
- Cualquier funcionalidad debe validarse contra los principios y la regla de oro.
- La documentación de decisiones técnicas debe guardarse en `Docs/ADR/`.
- La documentación de roles y comunicación debe consultarse en `Docs/02_ROLES_Y_COMUNICACION.md`.
- El norte estratégico está en `Docs/01_NORTE.md`.
