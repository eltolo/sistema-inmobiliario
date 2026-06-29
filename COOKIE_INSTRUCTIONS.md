# Pasos para resolver la verificación de Zonaprop

1. **Abrir Chrome (o tu navegador preferido) y loguearte manualmente en Zonaprop**
   - Navegá a `https://www.zonaprop.com.ar` y resolvé el mensaje *“Verificación de seguridad en curso”* (puede pedir recaptcha). Esperá hasta que la página muestre el formulario de login.
   - Iniciá sesión con tu cuenta (Google u otro método) como hacés normalmente.

2. **Exportar las cookies después de la verificación exitosa**
   - Abre DevTools (`F12`) → pestaña Application → Cookies → `https://www.zonaprop.com.ar`.
   - Copiá todas las cookies a un archivo JSON con formato como el que guarda el agente (array de objetos con `name`, `value`, `domain`, `path`, `expiry`, etc.).
   - Guardá ese JSON en el workspace como `zonaprop_cookies.json`.

3. **Usar el agente con esa sesión**
   - Una vez guardadas las cookies, ejecutá `python agente.py` o `run_agent.bat`. El agente ya carga `zonaprop_cookies.json` antes de navegar, así reutiliza la sesión humana y evita la verificación.

4. **Si vuelve a aparecer la verificación**
   - Cierra el script, volvé a loguearte en el navegador real (paso 1) y exportá nuevamente las cookies (podés guardar múltiples snapshots en `cookies/` para rotación futura).
   - El agente detectará la pantalla naranja, rotará a otro snapshot y reintenta tras una pausa larga.

5. **Alternativa recomendada (ScrapingBee)**
   - Agregá `SCRAPINGBEE_API_KEY` y `SCRAPINGBEE_ONLY=true` en `.env`.
   - El agente usará ScrapingBee con proxies premium/stealth y evitará Selenium por completo.

6. **Fallback manual de descripción**
   - Si una propiedad queda incompleta, el agente deja `descripcion.txt` con encabezado `AUTO_GENERATED`.
   - Completá manualmente el texto de "Características" y borrá esa línea.
   - En la próxima corrida el agente detecta la descripción manual y la usa para generar el Word.

5. **Opcional: usar tu perfil real de Chrome**
   - Ejecutá el agente con `--user-data-dir="<tu ruta>" --profile-directory="Default"` para arrancar con el mismo perfil que ya pasa Cloudflare (cookies, extensiones, historial).
   - Si querés rotar entre perfiles, mantené varios directorios y cambialos según prefieras.

6. **Fallback externo (si todo falla)**
   - Como último recurso podés usar un proxy residencial o un servicio especializado (ScrapingBee, BrightData, etc.) para recuperar el HTML y luego aplicar nuestra lógica de parsing.
