# Plan Autonomo: Scraping Zonaprop Seguro

## Objetivo
Maximizar completitud de datos y descargas (texto + fotos + Word) evitando bloqueos, usando ScrapingBee como primer intento y fallback controlado.

## Criterios de exito
- >= 90% de propiedades con Word generado y fotos descargadas.
- `metricas_completitud.log` con >= 80% promedio por corrida.
- No bloqueo por verificacion al usar ScrapingBee (si falla, fallback funciona sin detener el proceso).

## Riesgos
- Cloudflare bloquea aun con proxies premium.
- Limites de la cuenta de ScrapingBee.
- Respuestas incompletas en `avisoInfo` (falta orientacion u otros).

## Estrategia
1. Ajustar ScrapingBee para uso premium/stealth y waits mas largos.
2. Mejorar parsing de respuesta OpenAI para diagnosticos.
3. Registrar resultados y errores por URL para aprendizaje.
4. Ejecutar corrida lenta y validar generacion de Word + fotos.

## Validacion
- Ejecutar `python agente.py` con `SCRAPINGBEE_ONLY=true` y ver logs.
- Revisar `fichas/*/descripcion.txt` y `fichas/*/*.docx`.
- Revisar `fichas/metricas_completitud.log`.
