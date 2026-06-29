# Plan de Implementación: Servidor de Procesamiento y Bot Inmobiliario

## 1. Visión General
El objetivo es transformar el flujo actual (local) en un sistema basado en servidor. El servidor web no solo mostrará las propiedades, sino que también se encargará del procesamiento de lenguaje natural (LLM) para normalizar textos, generar audios y alimentar un Bot de Consultas inteligente que responda sobre las publicaciones.

## 2. Arquitectura Propuesta

### Capa de Datos (Storage)
- Las propiedades se seguirán almacenando en carpetas, pero el servidor actuará como el orquestador.
- **Base de Conocimientos (RAG):** Implementaremos una base de datos vectorial simple o un archivo JSON estructurado para que el Bot pueda consultar detalles técnicos rápidamente.

### Capa de Procesamiento (Backend API)
- El servidor `server.js` (Express) se ampliará para manejar:
  - **Endpoints de LLM:** Rutas para procesar textos y generar TTS bajo demanda o en el momento de la carga.
  - **Endpoint de Chat:** Un motor de chat que use OpenAI (GPT-4o/mini) con contexto de las propiedades.

### Capa de Interfaz (Frontend)
- **Panel Admin:** Se moverán los scripts de Python (`rewriter_descripciones.py`, `rewriter_audios.py`) a funciones dentro del servidor Node.js o se ejecutarán vía `child_process`.
- **Bot de Consultas:** Un componente flotante en la web para que los clientes pregunten: "¿Tiene cochera?", "¿Cuánto son las expensas?", "¿Acepta mascotas?".

---

## 3. Lista de Tareas

### Fase 1: Migración de Lógica al Servidor
- [ ] **Tarea 1:** Integrar OpenAI SDK en `server.js`.
- [ ] **Tarea 2:** Crear endpoint `/api/process-property` que reemplace la lógica de `rewriter_descripciones.py`.
- [ ] **Tarea 3:** Crear endpoint `/api/generate-audio` que reemplace `rewriter_audios.py`.

### Fase 2: Bot de Consultas Inteligente
- [ ] **Tarea 4:** Implementar un sistema de "Contexto Dinámico". El bot debe conocer todas las propiedades activas.
- [ ] **Tarea 5:** Crear el endpoint `/api/chat` para procesar preguntas de usuarios usando RAG (Retrieval Augmented Generation) simple sobre el `properties.json`.
- [ ] **Tarea 6:** Diseñar el componente UI `ChatBot.tsx` flotante en el frontend.

### Fase 3: Preparación para Hosting
- [ ] **Tarea 7:** Configurar variables de entorno (`.env`) para producción.
- [ ] **Tarea 8:** Optimizar el manejo de archivos estáticos (imágenes y audios) para que el servidor los sirva eficientemente.

---

## 4. Riesgos y Mitigaciones
| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Costo de API OpenAI | Medio | Usar modelos `gpt-4o-mini` para el bot y cachear respuestas comunes. |
| Tiempo de respuesta | Bajo | Procesar textos y audios de forma asíncrona ("background tasks"). |
| Privacidad de datos | Bajo | No enviar datos sensibles a la API, solo descripciones públicas. |

---

## 5. Preguntas Abiertas
- ¿El hosting será un VPS (donde podemos correr Node.js libremente) o un hosting compartido?
- ¿Quieres que el Bot responda solo sobre la propiedad que el usuario está viendo, o sobre todo el catálogo?
