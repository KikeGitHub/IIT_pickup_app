# 🛡️ Seguridad, Privacidad y Blindaje Legal de Datos de Menores — IIT Pickup

**Documento Base Ejecutivo y Técnico para Presentación a Dirección General**  
**Institución:** Instituto Inglés de Toluca (IIT)  
**Plataforma:** IIT Pickup (`https://pickup.institutoingles.edu.mx`)  
**Marco Normativo Aplicable:** Ley Federal de Protección de Datos Personales en Posesión de los Particulares (**LFPDPPP**, reforma publicada en el DOF el 20 de marzo de 2025) y lineamientos aplicables al tratamiento digital de datos de niñas, niños y adolescentes en México.  
**Autoridad Garante Vigente:** **Secretaría Anticorrupción y Buen Gobierno** (en sustitución del extinto INAI).

---

## 1. Resumen Ejecutivo para Dirección

El sistema **IIT Pickup** procesa información de padres de familia, personal docente y **alumnos menores de edad** con el único propósito de agilizar y asegurar la entrega escolar en puerta.

Con el objetivo de **proteger la integridad de los estudiantes** y **blindar legalmente al Instituto Inglés de Toluca** frente a padres de familia, auditorías o autoridades administrativas, se implementó una arquitectura integral de **Privacidad y Seguridad desde el Diseño** que garantiza:

1. **Consentimiento expreso, informado y auditable** antes de ingresar al portal de padres.
2. **Módulo público de Aviso de Privacidad Integral** accesible sin necesidad de iniciar sesión (cumpliendo la LFPDPPP y políticas de tiendas de aplicaciones móviles).
3. **Minimización estricta de datos de menores** (operación basada en nombre, grado/grupo y fotografía **100% opcional**, sin biometría ni rastreo GPS continuo).
4. **Aislamiento de comunicaciones en tiempo real (API + WebSockets)** para que ningún externo ni otro padre pueda ver información de alumnos ajenos.
5. **Derecho efectivo de cancelación/borrado**, eliminando físicamente la fotografía del menor cuando el padre decide retirarla.

---

## 2. ¿Qué datos trata la plataforma y qué queda estrictamente excluido?

| Categoría | Datos tratados en la plataforma | Política de minimización y resguardo |
| :--- | :--- | :--- |
| **Alumnos (Menores de edad)** | Nombre completo, nivel escolar, grado/grupo y **fotografía opcional** | En el portal de padres no se exponen identificadores gubernamentales (como CURP) ni fechas de nacimiento. El sistema funciona al 100% aun sin fotografía. |
| **Padres / Tutores Legales** | Nombre completo, usuario/correo de acceso, teléfono opcional y vínculo familiar | Utilizado únicamente para autenticación, contacto de emergencia escolar y control de entrega autorizada. |
| **Bitácoras operativas** | Fecha/hora de aviso de llegada, modalidad (Auto / A pie) y sello de entrega | Permanece bajo custodia exclusiva del colegio para seguridad y trazabilidad diaria. |
| **Datos EXCLUIDOS (Lo que NO se hace)** | **Cero biometría / Cero GPS continuo / Cero publicidad** | No existe reconocimiento facial automatizado, no se rastrea la ubicación en segundo plano de los padres y no existe comercialización ni perfilamiento de datos. |

---

## 3. Pilares del Blindaje Legal (Cumplimiento LFPDPPP 2025)

### 3.1. Consentimiento Expreso en el Inicio de Sesión (Sin Casillas Pre-marcadas)
- En la pantalla de acceso para padres (`/auth/login`), el padre o tutor legal debe marcar manualmente una casilla (**desmarcada por defecto**, conforme exige la ley) declarando bajo su carácter de padre, madre o tutor legal que ha leído y aceptado el **Aviso de Privacidad Integral**.
- Desde ese mismo formulario puede abrir el texto completo del Aviso de Privacidad en ventana emergente sin perder sus credenciales escritas.
- Si el padre ya tenía una sesión iniciada previamente o se publica una nueva versión de la política de privacidad, el portal bloquea el uso operativo mediante un modal obligatorio hasta recabar su aceptación actualizada.

### 3.2. Prueba Jurídica Auditable (No Repudio)
Un checkbox visual sin respaldo en base de datos no tiene validez probatoria ante una controversia. Por ello, el backend valida la aceptación en cada inicio de sesión (`HTTP 428 Precondition Required` si falta o si cambió la versión) y guarda un **registro histórico inmutable** en la tabla `privacy_consent_logs` con:
- Identificador único y correo del padre/tutor.
- **Versión exacta** de la política aceptada (ej. `2026.1`).
- **Huella criptográfica SHA-256** del texto completo del Aviso de Privacidad (demuestra de manera matemática qué documento exacto aceptó el usuario).
- **Fecha y hora exacta** con zona horaria (`TIMESTAMPTZ`).
- **Dirección IP real y User-Agent** (dispositivo/navegador) desde donde se otorgó el consentimiento.

### 3.3. Módulo Público de Políticas de Privacidad (`/privacidad`)
- Ruta pública accesible **sin iniciar sesión** (`https://pickup.institutoingles.edu.mx/privacidad`) y enlazada desde ambos portales de acceso y desde el footer del portal de padres.
- Incluye:
  - **Aviso de Privacidad Simplificado** y **Aviso de Privacidad Integral** en 8 secciones claras.
  - Identidad y domicilio del Responsable (Instituto Inglés de Toluca).
  - Declaración explícita de uso exclusivo escolar, cero finalidades comerciales y carácter **100% opcional** de la fotografía del menor.
  - Declaración transparente de encargados tecnológicos de infraestructura (servidor privado cloud y almacenamiento multimedia Cloudinary).
  - Mecanismo oficial de **Derechos ARCO** (Acceso, Rectificación, Cancelación y Oposición) con plazos legales de respuesta (20 días hábiles + 15 días hábiles de ejecución).
  - Mención actualizada a la **Secretaría Anticorrupción y Buen Gobierno** como autoridad competente.
  - Botón para imprimir o guardar como PDF y consulta de constancias propias de aceptación para el padre autenticado.

### 3.4. Eliminación Real e Inmediata de Fotografías (Derecho de Cancelación)
- Al subir una fotografía opcional del menor, el backend genera un **identificador opaco aleatorio** (`student_<uuid>_<fecha>`), **evitando exponer el nombre del niño en la URL o nombre de archivo**.
- Si el padre decide pulsar **"Quitar foto actual"** en su portal (o la sustituye por otra), el sistema no solo limpia el campo en base de datos, sino que **destruye físicamente el archivo anterior** tanto en almacenamiento local como en Cloudinary.

---

## 4. Medidas de Seguridad Técnica Implementadas

| Capa | Control implementado | Beneficio de protección |
| :--- | :--- | :--- |
| **Transporte y Red** | HTTPS/TLS obligatorio (Let's Encrypt) + Nginx Proxy + puertos internos Docker vinculados exclusivamente a `127.0.0.1` (`8080`, `3001`, `5432`) | Ningún atacante o escáner externo puede conectarse directamente al backend ni a la base de datos. |
| **Autenticación y Contraseñas** | Tokens JWT firmados (HMAC-SHA256) sin estado y contraseñas cifradas con `BCrypt` (coste 12) + cambio obligatorio de clave temporal en primer ingreso | Impide lectura de contraseñas incluso ante acceso físico a respaldos y fuerza credenciales personales por familia. |
| **Control de Acceso (API REST)** | Autorización estricta por rol (`PARENT`, `TEACHER`, `MONITOR`, `ADMIN`). Se cerró el acceso público a `GET /api/v1/alerts/today/grouped` y endpoints de monitoreo | Ninguna persona externa sin sesión de docente, monitor o administrador puede consultar qué alumnos están saliendo en tiempo real. |
| **Seguridad en Tiempo Real (WebSockets)** | Validación obligatoria de JWT en `STOMP CONNECT` y aislamiento de suscripciones en `STOMP SUBSCRIBE` | Bloquea conexiones anónimas; cada padre recibe únicamente notificaciones de sus propios hijos vinculados, nunca de otros alumnos del colegio. |
| **Aislamiento de Imágenes** | Nombres de archivo opacos sin PII, cabeceras `Cache-Control: private` y `X-Robots-Tag: noindex, nofollow` | Evita que buscadores indexen imágenes y evita que las URLs revelen nombres de menores. |

---

## 5. Delimitación de Responsabilidades (Colegio vs. Desarrollador)

Para claridad jurídica de la Dirección del IIT (en concordancia con [FICHA_TRANSFERENCIA_CREDENCIALES_CUSTODIA_DATOS.md](./FICHA_TRANSFERENCIA_CREDENCIALES_CUSTODIA_DATOS.md)):

- **Instituto Inglés de Toluca ("Responsable del Tratamiento"):**
  - Es el titular legal de las bases de datos escolares y decide qué alumnos, padres y personal tienen acceso.
  - Administra las cuentas administrativas maestras, aprueba el texto legal final del Aviso de Privacidad y atiende solicitudes de **Derechos ARCO** recibidas por sus canales oficiales.
- **Consultor / Desarrollador ("Encargado Tecnológico"):**
  - Provee y mantiene la infraestructura técnica de software bajo instrucciones del colegio, sin derechos de propiedad, cesión ni explotación comercial sobre la información escolar.
  - Queda deslindado de responsabilidad ante el uso interno indebido de cuentas o extravío de credenciales administradas por el personal escolar.

---

## 6. Checklist de Requisitos Previos a Liberación Formal (Para Dirección del IIT)

Antes de comunicar oficialmente el módulo a la comunidad escolar, se solicita a Dirección confirmar o proporcionar los siguientes 4 puntos (configurables directamente en variables de entorno `.env` sin modificar código):

- [ ] **1. Razón Social completa** que aparecerá como Responsable (`PRIVACY_RESPONSIBLE_NAME`, actualmente: *Instituto Inglés de Toluca*).
- [ ] **2. Domicilio físico completo** del plantel para oír y recibir notificaciones (`PRIVACY_RESPONSIBLE_ADDRESS`).
- [ ] **3. Correo electrónico oficial para Derechos ARCO** supervisado por personal del colegio (`PRIVACY_ARCO_EMAIL`, sugerido: `privacidad@institutoingles.edu.mx`).
- [ ] **4. Validación jurídica final:** Revisión y visto bueno del texto publicado en `/privacidad` por el área o asesor legal de la institución.

---

## 7. Referencia Técnica Rápida de Archivos Implementados

<details>
<summary>Ver mapa técnico de implementación (para TI / Auditoría)</summary>

- **Base de Datos:** `stitch-pickup-be/src/main/resources/db/migration/V11__privacy_consent_audit.sql`
- **Módulo Privacidad (BE):** `stitch-pickup-be/src/main/java/com/stitchpickup/modules/privacy/` (`PrivacyController`, `PrivacyService`, `PrivacyConsentLog`, `PrivacyPolicyDocument`)
- **Validación Login y Errores (BE):** `AuthController.java`, `AuthService.java`, `LoginRequest.java`, `LoginResponse.java`, `GlobalExceptionHandler.java` (`HTTP 428`)
- **Blindaje de Seguridad (BE):** `SecurityConfig.java`, `WebSocketConfig.java`, `NotificationPublisher.java`, `ImageUploadService.java`, `ImageController.java`, `StudentService.java`
- **Módulo Privacidad (FE):** `stitch-pickup-fe/src/app/features/privacy/` y ruta pública `/privacidad` en `app.routes.ts`
- **Checkbox Login y Portal Padres (FE):** `login-parent.component.*`, `parent-dashboard.component.*`, `auth.service.ts`, `privacy.service.ts`, `websocket.service.ts`
- **Configuración Despliegue:** `.env.example`, `docker-compose.yml`, `application.yml`

</details>
