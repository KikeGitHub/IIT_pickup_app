# ACTA DE ENTREGA - RECEPCIÓN DEFINITIVA DE PROYECTO DE SOFTWARE
## Y CONFORMIDAD DE CIERRE DE DESARROLLO

**Proyecto:** Sistema Inteligente de Logística y Despacho Escolar: **IIT-Pickup (Stitch Pickup)**  
**Lugar:** Toluca de Lerdo, Estado de México  
**Fecha de Emisión:** _____ de Octubre de 2026  
**Dominio de Producción:** [https://pickup.institutoingles.edu.mx](https://pickup.institutoingles.edu.mx)  

---

### REUNIDOS

De una parte, **Enrique Durán Jiménez**, en su carácter de Consultor y Desarrollador de Software Sr. (en lo sucesivo denominado **"EL DESARROLLADOR"** o **"EL PRESTADOR"**).

Y de la otra parte, el **Instituto Inglés de Toluca** (en lo sucesivo denominado **"EL CLIENTE"** o **"LA INSTITUCIÓN"**), legalmente representado en este acto por el/la **C. __________________________________________________**, en su calidad de **Director(a) General / Representante Legal**.

Ambas partes se reconocen mutuamente la capacidad legal y técnica suficiente para la suscripción de la presente **ACTA DE ENTREGA - RECEPCIÓN DEFINITIVA**, bajo los siguientes antecedentes y cláusulas:

---

### ANTECEDENTES

1. **PRIMERO.** En el mes de julio de 2026, las partes acordaron la contratación para el diseño, desarrollo, pruebas, configuración de infraestructura y puesta en producción del sistema informático denominado **"IIT-Pickup"**, orientado a resolver la congestión vial, agilizar la entrega de alumnos y brindar certeza y seguridad física a la comunidad escolar.
2. **SEGUNDO.** En la Propuesta Técnica y Comercial se estipuló una inversión total por el desarrollo, licenciamiento y entrega del sistema de **$30,000.00 MXN** *(Treinta mil pesos 00/100 M.N.)*, bajo un esquema de pago 50/50:
   - **50% de Anticipo Inicial:** Por el monto de **$15,000.00 MXN** *(Quince mil pesos 00/100 M.N.)*, el cual fue debidamente cubierto al inicio de los trabajos.
   - **50% de Finiquito y Cierre:** Por el monto de **$15,000.00 MXN** *(Quince mil pesos 00/100 M.N.)*, condicionado a la entrega final del sistema, validación de pruebas funcionales y suscripción de la presente acta de conformidad.
3. **TERCERO.** Habiéndose completado el ciclo de desarrollo de software, la configuración de servidores dedicados en la nube, el despliegue con dominio institucional y certificado de seguridad SSL, así como las pruebas de aceptación de usuario (UAT), las partes proceden a formalizar la entrega y recepción a entera satisfacción.

---

## 1. RESUMEN DE FUNCIONALIDADES ENTREGADAS

A continuación, se detalla el compendio de funcionalidades entregadas, probadas y operativas en el entorno productivo oficial, clasificadas por perfil de usuario:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DEL SISTEMA                        │
│ ┌──────────────────────┐ ┌─────────────────────┐ ┌───────────────────┐ │
│ │   PORTAL DE PADRES   │ │ PORTAL DE DOCENTES  │ │    SUPER ADMIN    │ │
│ │ (Mobile PWA / Web)   │ │  (Monitor de Patio) │ │(Control y Métricas│ │
│ └──────────┬───────────┘ └──────────┬──────────┘ └─────────┬─────────┘ │
│            │                        │                      │           │
│            ▼                        ▼                      ▼           │
│   WebSockets (STOMP/SSL) + API REST Spring Boot 3.3.5 (Java 21)        │
│   PostgreSQL 16 en Hetzner Cloud (pickup.institutoingles.edu.mx)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1.1 Portal para Padres de Familia (Mobile PWA & Web Responsive)
*Acceso:* `https://pickup.institutoingles.edu.mx/auth/login`

* **Autenticación Individual Segura:** Acceso por credencial/usuario asignado y contraseña con encriptación robusta.
* **Política de Seguridad Inicial:** Flujo de cambio obligatorio de contraseña en el primer inicio de sesión para salvaguardar la privacidad de la cuenta.
* **Soporte Multi-Hijo / Tutor Familiar:** Detección automática y visualización unificada de uno o más estudiantes matriculados asociados al mismo tutor, permitiendo notificarlos en bloque o de forma individual.
* **Botones de Proximidad en Tiempo Real:** 
  * `10 MIN` (Aproximándome / en trayecto).
  * `5 MIN` (A pocas cuadras / en inmediaciones).
  * `EN FILA` (Dentro del carril vehicular o bahía de entrega).
* **Alerta Urgente / Retraso Imprevisto:** Notificación de alta prioridad con aviso sonoro y distintivo visual en patio para casos que requieran atención inmediata del personal docente.
* **Modalidad de Entrega:** Selector flexible de llegada para diferenciar si el padre acude **En Auto** o **A Pie (Peatonal)**.
* **Reversión de Alertas por Error (`↩ Cancelar aviso`):** Función de autocorrección que permite al padre deshacer una alerta emitida por equivocación, retirando la notificación del monitor escolar al instante.
* **Resiliencia Operativa Offline-First (PWA):** Encolamiento local de alertas en el dispositivo móvil mediante `IndexedDB` en caso de pérdida de cobertura 4G/WiFi en la zona escolar, con reenvío e idempotencia automática al recuperar la señal.
* **Confirmación de Recepción y Cierre Seguro:**
  * Notificación en pantalla cuando el docente hace entrega del menor en puerta, con botón `✅ Confirmar que Recibí a mi Hijo`.
  * Botón de contingencia `✅ Ya me entregaron` con firma digital de tiempo para cerrar el ciclo si el monitor olvidó registrarlo en la tableta.

---

### 1.2 Portal de Docentes, Guardias y Monitores de Circuito
*Acceso:* `https://pickup.institutoingles.edu.mx/auth/maestros` | Monitor: `/monitor`

* **Monitor en Tiempo Real (Bento/Kanban Interactivo):** Tablero reactivo alimentado por WebSockets seguros (`wss://`) que actualiza la llegada de vehículos y peatones en milisegundos sin necesidad de refrescar el navegador.
* **Priorización Inteligente de Circuito:** Organización automática de los estudiantes, colocando en primer orden de llamado a aquellos cuyos tutores han marcado estar físicamente `EN FILA`.
* **Alertas Sonoras y Visuales:** Tonos auditivos audibles y tarjetas de alta visibilidad para identificar ingresos inmediatos a la fila o avisos urgentes.
* **Filtros Operativos de Despacho:** Segmentación instantánea por nivel educativo (Kínder, Primaria, Secundaria) y grados/grupos para coordinar la salida ordenada por salones.
* **Despacho con 1 Clic ("Entregar Alumno"):** Registro instantáneo de la entrega en puerta con captura automática de marca de tiempo (timestamp).
* **Reversión de Entregas Accidentales ("Deshacer Entrega"):** Herramienta de seguridad en la bitácora del día que permite reincorporar al alumno al tablero activo en caso de pulsación involuntaria en la tableta del docente.
* **Directorio Escolar "Mis Grupos":**
  * Consulta de nómina de alumnos por aula con estatus de matrícula.
  * Verificación de hasta 3 tutores o familiares legalmente autorizados por alumno.
* **Soporte Ágil de Contraseñas para Padres:**
  * Restablecimiento de contraseña temporal para padres en 1 clic directamente por el profesor.
  * Generación de enlace directo para compartir accesos al tutor vía **WhatsApp** en menos de 5 segundos, evitando saturar al área de sistemas.
* **Modo Pantalla Completa:** Optimización visual para pantallas de patio de 75"-85" y proyectores escolares.

---

### 1.3 Módulo de Super Administración y Dirección General
*Acceso:* `https://pickup.institutoingles.edu.mx/admin`

* **Dashboard de Métricas y KPIs de Despacho:** Gráficas en tiempo real de volumen de entregas del día, tiempos promedio de espera en fila, horas pico de desahogo vial y análisis de cuellos de botella.
* **Gestión Integral de Usuarios y Control de Accesos (RBAC):** Catálogo centralizado para crear, modificar, suspender, desbloquear y eliminar usuarios con roles diferenciados: `PADRE`, `DOCENTE`, `MONITOR`, `ADMIN` y `SUPER_ADMIN`.
* **Configuración de Estructura Escolar:** Mantenimiento de niveles educativos, grados, grupos y asignación de tutores/profesores titulares a cada salón.
* **Padrón de Estudiantes y Vinculación Familiar:** Alta y edición de fichas de estudiantes con CURP, fotografía oficial y vinculación relacional a sus respectivos tutores.
* **Importador Masivo Inteligente (CSV/Excel):** Herramienta de carga masiva por lotes que procesa plantillas escolares completas de alumnos y tutores, con previsualización, validación sintáctica y reporte de inconsistencias en segundos.
* **Bitácora Inmutable de Auditoría (Delivery Log):** Registro histórico auditable de cada entrega realizada en el ciclo escolar, conteniendo: fecha, hora exacta, nombre del alumno, grupo, tutor que retiró, docente que despachó y modalidad de salida.
* **Protección Transaccional y Paginación:** Tablas optimizadas para alto rendimiento (15, 30 y 100 registros por vista) y bloqueo de pantalla transaccional (*Loading Overlay*) para evitar duplicación de datos durante operaciones críticas.

---

### 1.4 Infraestructura y Entorno Productivo Suministrado

* **Servidor en la Nube:** Servidor dedicado de alto rendimiento en Hetzner Cloud (Ubuntu 24.04 LTS, 4 GB RAM, procesador de alta frecuencia).
* **Dominio Institucional Configurado:** `pickup.institutoingles.edu.mx` enrutado con registros DNS tipo A en cPanel.
* **Seguridad Criptográfica SSL/TLS:** Certificado Let's Encrypt con renovación periódica automatizada, protocolo HTTPS/HTTP2 forzado y cabecera de seguridad estricta HSTS (`max-age=31536000`).
* **Arquitectura de Microservicios Contenerizados:** Implementación modular con Docker Compose v2:
  * Contenedor Nginx Alpine (Reverse Proxy, SSL, Gzip, Balanceador y Servidor Web).
  * Contenedor Backend Spring Boot 3.3.5 / Java 21 con G1GC optimizado.
  * Contenedor de Base de Datos PostgreSQL 16 con volumen persistente de alta velocidad.
* **Seguridad de Red Perimetral (Principio de Menor Exposición):** Firewall UFW activo. Ni la base de datos ni el backend exponen puertos públicos a Internet, quedando confinados en una red virtual interna aislada (`stitch-network`).

---

## 2. CHECKLIST DE CONFORMIDAD Y PRUEBAS DE ACEPTACIÓN (UAT)

Las pruebas descritas a continuación fueron ejecutadas satisfactoriamente por el personal del Instituto y verificadas por la Dirección:

| # | Requerimiento / Prueba de Validación | Criterio de Aceptación | Estado | Validación Cliente |
|:---:|:---|:---|:---:|:---:|
| **1** | **Acceso y Autenticación de Padres** | Ingreso correcto con credenciales asignadas y exigencia de cambio de contraseña en el primer acceso. | **CONFORME** | `[ X ] APROBADO` |
| **2** | **Envío de Proximidad (10m, 5m, En Fila)** | La notificación del padre se refleja en el monitor escolar en menos de 1 segundo vía WebSockets. | **CONFORME** | `[ X ] APROBADO` |
| **3** | **Alerta Urgente y Selector Auto/Peatonal** | Despliegue visual prioritario y tono auditivo en el monitor al disparar alerta urgente o cambio de modalidad. | **CONFORME** | `[ X ] APROBADO` |
| **4** | **Reversión de Aviso por Error** | El botón de cancelar retira al alumno del tablero del colegio de forma limpia e instantánea. | **CONFORME** | `[ X ] APROBADO` |
| **5** | **Monitor de Patio y Ordenamiento por Fila** | Los alumnos cuyos padres están físicamente formados se colocan al inicio del tablero para llamado inmediato. | **CONFORME** | `[ X ] APROBADO` |
| **6** | **Despacho y Registro de Salida** | Al pulsar "Entregar", el alumno pasa a la bitácora de entregados y se notifica al dispositivo del tutor. | **CONFORME** | `[ X ] APROBADO` |
| **7** | **Función "Deshacer Entrega" Accidental** | Si el docente presiona por error, puede reincorporar al alumno al tablero activo inmediatamente. | **CONFORME** | `[ X ] APROBADO` |
| **8** | **Restablecimiento de Clave vía WhatsApp** | El docente genera clave temporal para el padre y abre WhatsApp con el mensaje pre-redactado con 1 clic. | **CONFORME** | `[ X ] APROBADO` |
| **9** | **Carga Masiva de Alumnos y Padres (CSV)** | El importador del portal Admin lee plantillas escolares masivas, valida datos y da de alta los registros. | **CONFORME** | `[ X ] APROBADO` |
| **10** | **Historial y Bitácora Legal de Entregas** | Consulta de registros pasados con fecha, hora, tutor que recogió y docente que despachó. | **CONFORME** | `[ X ] APROBADO` |
| **11** | **Dominio Institucional y Candado SSL** | Acceso bajo `https://pickup.institutoingles.edu.mx` con cifrado seguro y redirección HTTP automática. | **CONFORME** | `[ X ] APROBADO` |
| **12** | **Documentación y Manuales Operativos** | Entrega de manuales ilustrados de usuario para Padres de Familia y para Personal Docente/Monitores. | **CONFORME** | `[ X ] APROBADO` |

---

## 3. CLÁUSULAS LEGALES, ADMINISTRATIVAS Y FINIQUITO ECONÓMICO

### CLÁUSULA PRIMERA. RECEPCIÓN A ENTERA SATISFACCIÓN
**"EL CLIENTE"** declara haber participado en la revisión, auditoría y pruebas del sistema informático **IIT-Pickup**, manifestando que el software cumple cabalmente con las especificaciones técnicas, requerimientos de negocio, niveles de seguridad y estándares de diseño acordados. En consecuencia, lo recibe a su **ENTERA Y TOTAL SATISFACCIÓN**.

### CLÁUSULA SEGUNDA. CIERRE FORMAL DE LA ETAPA DE DESARROLLO
A través de la firma de este instrumento, ambas partes declaran **FORMAL Y LEGALMENTE CONCLUIDA LA ETAPA DE DESARROLLO Y PUESTA EN MARCHA**. **"EL DESARROLLADOR"** ha cumplido con todos y cada uno de los entregables comprometidos en la propuesta comercial de origen.

### CLÁUSULA TERCERA. LIBERACIÓN DEL FINIQUITO ECONÓMICO ($15,000.00 MXN)
En virtud de la entrega formal y la aceptación plena estipulada en las cláusulas precedentes, **"EL CLIENTE"** autoriza y procede a la liberación inmediata del pago correspondiente al **50% (cincuenta por ciento) restante**, correspondiente al finiquito del contrato de desarrollo:

* **Monto Total del Proyecto:** $30,000.00 MXN *(Treinta mil pesos 00/100 M.N.)*
* **Anticipo Pagado al Inicio:** $15,000.00 MXN *(Quince mil pesos 00/100 M.N.)*
* **Saldo a Liquidar mediante esta Acta:** **$15,000.00 MXN** *(Quince mil pesos 00/100 M.N.)*

**Compromiso de Pago:** **"EL CLIENTE"** se compromete a realizar la transferencia bancaria por dicho importe en un plazo no mayor a **____ días hábiles** a partir de la firma de la presente acta, a la siguiente cuenta bancaria del prestador:
* **Beneficiario:** Enrique Durán Jiménez
* **Institución Bancaria:** ________________________________________
* **CLABE Interbancaria (18 dígitos):** ________________________________________
* **Número de Cuenta:** ________________________________________
* **Concepto de Pago:** Finiquito Desarrollo IIT-Pickup

### CLÁUSULA CUARTA. GARANTÍA TÉCNICA DE SOFTWARE
**"EL DESARROLLADOR"** otorga una garantía de software por un periodo de **60 (sesenta) días naturales**, contados a partir de la firma de la presente acta. 
* **Alcance:** La garantía ampara la corrección sin costo adicional de cualquier error de programación (*bugs*), vicio oculto o comportamiento inconsistente atribuible al código desarrollado.
* **Exclusiones:** La garantía no cubrirá fallas imputables a caídas generales del proveedor de Internet del colegio, saturación de la red Wi-Fi escolar ajena al servidor, daños físicos en los dispositivos de los usuarios o manipulación no autorizada en la configuración del servidor Hetzner Cloud.

### CLÁUSULA QUINTA. ENTREGA DE MANUALES, CLAVES Y PROPIEDAD
**"EL DESARROLLADOR"** hace entrega formal de:
1. Acceso a las cuentas administrativas maestras (`admin@iit.edu.mx`).
2. Documento operativo digital: **Manual de Usuario para Padres de Familia**.
3. Documento operativo digital: **Manual de Operación para Docentes y Monitores de Circuito**.
4. Repositorio de código fuente y manual de comandos para administración del contenedor en Hetzner Cloud.

**"EL CLIENTE"** adquiere la licencia y derecho de explotación del software para uso exclusivo en las operaciones de sus planteles educativos.

### CLÁUSULA SEXTA. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS
Ambas partes ratifican su compromiso con la debida observancia de la *Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)* de los Estados Unidos Mexicanos, asegurando la confidencialidad, integridad y resguardo de la información de los alumnos, familias y docentes registrada en la base de datos del sistema.

---

## 4. CONFORMIDAD Y FIRMAS

Leída que fue la presente Acta de Entrega - Recepción y enteradas las partes de su contenido, alcance y fuerza legal, la firman por duplicado de común acuerdo, en la ciudad de Toluca de Lerdo, Estado de México, el día _____ del mes de Octubre de 2026.

<br><br>

```
                  POR "EL CLIENTE"                                      POR "EL DESARROLLADOR"
          INSTITUTO INGLÉS DE TOLUCA                                  CONSULTOR Y DESARROLLADOR SR.




    ____________________________________________              ____________________________________________
             NOMBRE Y FIRMA DEL REPRESENTANTE                             ENRIQUE DURÁN JIMÉNEZ
                    DIRECTOR(A) GENERAL                                 Consultor de Software Sr.
               (O REPRESENTANTE LEGAL)
    
    Sello de la Institución:
```

<br>

```
                                                  TESTIGOS




    ____________________________________________              ____________________________________________
             TESTIGO 1 POR LA INSTITUCIÓN                              TESTIGO 2 POR LA INSTITUCIÓN
        Cargo: Coordinación Administrativa /                     Cargo: Coordinación de Tecnologías /
               Control Escolar                                          Docencia
        Nombre: ________________________________                 Nombre: ________________________________
```
