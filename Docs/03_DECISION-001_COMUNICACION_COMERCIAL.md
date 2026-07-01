# DECISION-001: Revisión completa de la comunicación comercial

## Estado

- **Estado:** En progreso (a la espera de aprobación).
- **Bloquea:** CONV-001, LEAD-002, UX-001 y cualquier otro ticket que haga referencia a "tasación sin cargo", CTAs de Home o Landing.
- **Fecha de creación:** 2025-06-30.

## Contexto

La landing principal (`TICKET-001` / `CONV-001`) fue implementada para captar propietarios en CABA. Antes de continuar con nuevas funcionalidades (formularios de tasación, reordenamiento de navegación, backend de leads, etc.) se requiere aprobar la propuesta de valor y el tono de comunicación comercial.

Este documento consolida las decisiones pendientes y la propuesta actual para que Carina y/o Claudia la revisen y aprueben.

## Preguntas de negocio pendientes

1. **Propuesta de valor central:** ¿La promesa principal es "tasación sin cargo" o "conocer el valor de tu propiedad con acompañamiento profesional"?
2. **CTA principal:** ¿Es "Solicitar tasación", "Vender mi propiedad", "Consultar tasación" u otro?
3. **CTA secundario:** ¿Es "Ver propiedades", "Contactar por WhatsApp", "Conocer el equipo" u otro?
4. **Navegación:** ¿Se agrega un ítem de menú "Tasación" o "Vender/Alquilar"? ¿Se reordenan los enlaces existentes?
5. **WhatsApp flotante:** ¿El mensaje debe ser genérico, orientado a tasación, o variable según la página?
6. **Equipo / personal branding:** ¿Se publican nombres y fotos de Carina y Claudia o se mantiene el enfoque institucional por ahora?
7. **Formularios:** ¿La captación de leads se hace solo por WhatsApp o se agrega un backend de formularios (LEAD-002 / LEAD-003)?
8. **Tono de comunicación:** ¿Más institucional, más cercano, o mixto?

## Propuesta actual (para aprobación)

> **Nota:** Esta es la propuesta que hoy está implementada en `Home.tsx`. Se puede aprobar, modificar o rechazar.

### Propuesta de valor

> "Vendé o alquilá tu propiedad en CABA con acompañamiento profesional."

Acompañamiento completo: atención personalizada, tasación sin cargo, publicación en portales, fotografía de calidad, difusión en redes sociales y seguimiento hasta el cierre.

### CTAs

- **Primario:** "Solicitar tasación" (desplaza al formulario de contacto).
- **Secundario:** "Ver propiedades" (ancla a la sección de propiedades destacadas).

### Secciones de la landing

1. Hero con propuesta de valor y CTAs.
2. Beneficios: tasación, fotos, difusión, seguimiento.
3. ¿Por qué elegirnos?
4. Equipo institucional (sin nombres ni fotos personales hasta aprobación).
5. Propiedades destacadas.
6. Formulario de contacto / CTA final.

### WhatsApp flotante

Mensaje principal en Home:
> "Hola, quiero conocer el valor de mi propiedad en CABA. ¿Me pueden asesorar?"

### Equipo

Se mantiene institucional por ahora: "Directora" y "Asesora inmobiliaria", sin nombres ni fotos.

## Opciones alternativas

### Opción A: Tasación sin cargo como gancho principal

- Hero: "Tasación sin cargo de tu propiedad en CABA".
- CTA primario: "Solicitar tasación gratis".
- Ventaja: mensaje claro y fácil de entender.
- Riesgo: puede atraer consultas no calificadas.

### Opción B: Acompañamiento profesional como propuesta principal

- Hero: "Vendé o alquilá tu propiedad en CABA con acompañamiento profesional".
- CTA primario: "Solicitar asesoramiento".
- Ventaja: comunica valor diferencial y servicio completo.
- Riesgo: menos concreto que "tasación gratis".

### Opción C: Vender/Alquilar como propuesta principal

- Hero: "Vendé o alquilá tu propiedad en CABA".
- CTA primario: "Publicar mi propiedad".
- Ventaja: orientado al objetivo final del propietario.
- Riesgo: puede sonar más transaccional y menos consultivo.

## Criterios de aprobación

Para aprobar DECISION-001 se debe definir:

1. Propuesta de valor final (texto exacto del Hero).
2. CTA primario y secundario (texto y destino).
3. Mensaje de WhatsApp flotante.
4. Si se publican nombres y fotos del equipo.
5. Si se agrega backend de formularios o se queda en WhatsApp.
6. Cambios necesarios en navegación (UX-001).

## Impacto en tickets

Una vez aprobado este documento se actualizarán:

- `CONV-001`: ajustar copy, CTAs y mensaje de WhatsApp según decisión final.
- `LEAD-002`: si se decide agregar backend de formularios, se actualiza su alcance.
- `UX-001`: reordenar navegación y CTAs principales según decisión.
- `TICKET-001`: marcar como completado si la landing cumple con la versión aprobada.
- Cualquier otro ticket que mencione "tasación sin cargo".

## Pendientes

- [ ] Aprobación de Carina / Claudia de la propuesta comercial.
- [ ] Ajustes de copy en Home, WhatsApp y navegación según lo aprobado.
- [ ] Revisión de Lighthouse (Performance > 90, SEO > 95) antes de deploy.
- [ ] Deploy a producción una vez aprobado.

## Notas

- No se realizará deploy a producción de TICKET-001 hasta que DECISION-001 esté aprobado.
- No se avanzará con LEAD-002, UX-001 ni otras features dependientes hasta obtener el OK.
- Las fotos personales de Carina y Claudia no se publicarán sin autorización explícita.
