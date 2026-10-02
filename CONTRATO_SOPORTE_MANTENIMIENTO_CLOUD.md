# CONTRATO DE PRESTACIÓN DE SERVICIOS DE SOPORTE TÉCNICO,
## MANTENIMIENTO PREVENTIVO/CORRECTIVO E INFRAESTRUCTURA CLOUD

**Sistema:** Plataforma Integral de Logística Escolar **IIT-Pickup**  
**Dominio Oficial:** [https://pickup.institutoingles.edu.mx](https://pickup.institutoingles.edu.mx)  
**Lugar de Celebración:** Toluca de Lerdo, Estado de México  
**Fecha de Inicio de Vigencia:** _____ de _______________ de 2026  

---

### REUNIDOS

De una parte, **Enrique Durán Jiménez**, profesionista independiente, consultor y desarrollador de software (en lo sucesivo denominado **"EL PRESTADOR"** o **"EL PROVEEDOR"**).

Y de la otra parte, el **Instituto Inglés de Toluca** (en lo sucesivo denominado **"EL CLIENTE"** o **"LA INSTITUCIÓN"**), legalmente representado en este acto por el/la **C. __________________________________________________**, en su carácter de **Director(a) General / Representante Legal**.

Ambas partes se reconocen recíprocamente la personalidad jurídica y capacidad legal suficiente para obligarse en los términos del presente instrumento, al tenor de las siguientes:

---

### DECLARACIONES

**I. Declara "EL PRESTADOR":**
1. Que es una persona física de nacionalidad mexicana, con plena capacidad legal para ejercer el comercio y prestar servicios profesionales especializados en tecnologías de la información, administración de infraestructura en la nube y desarrollo de software.
2. Que cuenta con los conocimientos técnicos, experiencia, infraestructura y herramientas necesarias para garantizar la continuidad operativa, seguridad y mantenimiento de la plataforma **IIT-Pickup**.
3. Que reconoce como su domicilio fiscal y de notificación el ubicado en el Estado de México y pone a disposición los canales de atención de soporte vía correo electrónico y mensajería instantánea directa.

**II. Declara "EL CLIENTE":**
1. Que es una institución educativa constituida y con reconocimiento oficial, dedicada a la prestación de servicios de enseñanza.
2. Que cuenta con las facultades legales suficientes para celebrar el presente contrato a través de su Director(a) General o Representante Legal, personería que no le ha sido revocada ni limitada a la fecha.
3. Que habiendo recibido a entera satisfacción el desarrollo del sistema **IIT-Pickup**, es de su primordial interés garantizar la máxima disponibilidad, seguridad, resguardo de datos y funcionamiento ininterrumpido del sistema durante el ciclo escolar.

Expuesto lo anterior, las partes acuerdan sujetarse a las siguientes:

---

### CLÁUSULAS

---

#### CLÁUSULA PRIMERA. OBJETO DEL CONTRATO
El presente contrato tiene por objeto regular la prestación de los servicios profesionales de **Soporte Técnico Especializado, Mantenimiento de Software Preventivo/Correctivo y Administración de Infraestructura en la Nube (Cloud Hosting)** para la plataforma web y progresiva (PWA) **IIT-Pickup**, desplegada en el dominio institucional `https://pickup.institutoingles.edu.mx`.

---

#### CLÁUSULA SEGUNDA. SERVICIOS INCLUIDOS EN LA COBERTURA MENSUAL
Por virtud de la cuota mensual pactada, **"EL PRESTADOR"** proporcionará de manera recurrente a **"EL CLIENTE"** los siguientes servicios integrales:

1. **Renta y Administración del Servidor Dedicado VPS (Cloud Hosting):**
   * Alojamiento de alto rendimiento en infraestructura dedicada **Hetzner Cloud** (Servidor virtual optimizado CPX22, 4 GB RAM, procesadores de alta frecuencia y almacenamiento SSD NVMe en red europea certificada ISO 27001).
   * Mantenimiento y optimización de contenedores Docker (Frontend Nginx Alpine, Backend Spring Boot 3.3.5 / Java 21 y Base de Datos PostgreSQL 16).
   * Monitoreo proactivo de consumo de memoria RAM, CPU y espacio en disco para evitar saturación del sistema.

2. **Respaldos Automatizados Diarios de Base de Datos (Disaster Recovery):**
   * Generación nocturna automatizada de volcados (*dumps*) completos de la base de datos PostgreSQL 16 con registros de alumnos, tutores, asistencias y bitácora de entregas.
   * Política de retención histórica rotativa y almacenamiento secundario fuera del servidor principal para contingencias de desastre (*Off-site Disaster Recovery*).

3. **Gestión y Renovación de Seguridad SSL/TLS:**
   * Mantenimiento de la capa de cifrado criptográfico HTTPS con certificados de seguridad emitidos por Let's Encrypt.
   * Renovación automatizada y supervisada sin interrupción de servicio, preservando cabeceras HSTS (`max-age=31536000`) y candado verde institucional.

4. **Monitoreo de Disponibilidad 24/7 de la Plataforma (Uptime):**
   * Supervisión periódica automatizada del estado de los servicios web, endpoints REST y conexión WebSocket STOMP.
   * Detección temprana de anomalías o caídas de servicio para reinicio preventivo de microservicios.

5. **Actualizaciones de Seguridad y Parches del Sistema Operativo:**
   * Aplicación regular de parches de seguridad críticos sobre el sistema operativo base Ubuntu 24.04 LTS.
   * Mitigación de vulnerabilidades conocidas y depuración periódica de registros (*log rotation*) para optimizar el rendimiento del servidor.

6. **Mesa de Ayuda y Soporte Técnico Operativo:**
   * Asistencia técnica a los administradores escolares y directivos para consultas operativas sobre carga de alumnos, asignación de roles o fallas de conectividad reportadas por familias o docentes.

---

#### CLÁUSULA TERCERA. ACUERDO DE NIVEL DE SERVICIO (SLA) Y TIEMPOS DE RESPUESTA
Con el propósito de salvaguardar la logística del colegio en momentos neurálgicos, las partes establecen el siguiente **Acuerdo de Nivel de Servicio (SLA)** según la criticidad de la incidencia:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE TIEMPOS DE RESPUESTA (SLA)                     │
├────────────────────┬─────────────────────────────┬──────────────────────────┤
│ NIVEL DE PRIORIDAD │ VENTANA OPERATIVA           │ TIEMPO MÁXIMO RESPUESTA  │
├────────────────────┼─────────────────────────────┼──────────────────────────┤
│ 🚨 P1 - CRÍTICA    │ Horario Pico Salida Escolar │ Menos de 2 HORAS         │
│                    │ (Lunes a Viernes 13:00-16:00)│ (Respuesta < 30 min)     │
├────────────────────┼─────────────────────────────┼──────────────────────────┤
│ ⚠️ P2 - ALTA       │ Jornada Laboral General     │ Menos de 4 HORAS         │
│                    │ (Lunes a Viernes 08:00-18:00)│                          │
├────────────────────┼─────────────────────────────┼──────────────────────────┤
│ ℹ️ P3 - MEDIA/BAJA │ Consultas operativas, dudas │ Menos de 24 HORAS hábiles│
│                    │ o ajustes menores           │                          │
└────────────────────┴─────────────────────────────┴──────────────────────────┘
```

* **Disponibilidad Objetivo (Uptime):** **"EL PRESTADOR"** se compromete a mantener un índice de disponibilidad del **99.5%** durante los días hábiles del ciclo escolar, excluyendo ventanas de mantenimiento preventivo previamente programadas en horario no escolar (madrugadas o fines de semana).
* **Canal Exclusivo de Atención Prioritaria:** Las incidencias críticas de Nivel P1 se atenderán mediante línea telefónica directa y grupo de mensajería instantánea (WhatsApp de Soporte) con la Dirección y Coordinación Operativa.

---

#### CLÁUSULA CUARTA. CONTRAPRESTACIÓN, PERIODICIDAD Y CONDICIONES DE PAGO
Por la prestación integral de los servicios descritos en este contrato, **"EL CLIENTE"** se obliga a pagar a **"EL PRESTADOR"** la siguiente contraprestación fija mensual:

* **Monto Mensual:** **$1,500.00 MXN** *(Mil quinientos pesos 00/100 M.N.)* netos.
* **Fecha Límite de Pago:** Dentro de los **primeros 5 (cinco) días naturales** de cada mes calendario devengado.
* **Inicio del Cobro Recurrente:** El cobro inicia a partir del día **_____ de _______________ de 2026** (fecha de firma del contrato / primer día del mes corriente).
* **Método de Pago:** Transferencia electrónica de fondos (SPEI) a la siguiente cuenta bancaria:
  * **Beneficiario:** Enrique Durán Jiménez
  * **Institución Bancaria:** ________________________________________
  * **CLABE Interbancaria (18 dígitos):** ________________________________________
  * **Número de Cuenta:** ________________________________________
  * **Concepto:** Soporte Cloud IIT-Pickup - [Mes / Año]

* **Consecuencias por Mora:** En caso de suscitarse un retraso mayor a **10 (diez) días naturales** posteriores a la fecha límite sin justificación acordada, **"EL PRESTADOR"** quedará facultado para suspender de forma temporal el acceso a los servicios de soporte y/o restringir los recursos del servidor hasta la regularización del adeudo, sin responsabilidad por demoras operativas resultantes.

---

#### CLÁUSULA QUINTA. EXCLUSIONES EXPRESAS DE LA COBERTURA
A fin de delimitar responsabilidades y evitar desvíos en el alcance contratado (*scope creep*), las partes acuerdan expresamente que **NO están incluidos** dentro de la cuota mensual de $1,500.00 MXN los siguientes conceptos:

1. **Nuevas Funcionalidades o Módulos:** Cualquier desarrollo de software adicional, pantallas nuevas, cambios profundos en las reglas de negocio, integración con sistemas contables/académicos externos o rediseños de interfaces. Todo requerimiento nuevo será cotizado de forma independiente mediante una orden de trabajo por separado.
2. **Infraestructura Física Local del Colegio:** Falla en la conectividad a Internet del proveedor local del colegio (ej. cortes de fibra de Telmex, Totalplay), saturación de access points Wi-Fi en patio o problemas de router en las instalaciones del instituto.
3. **Hardware de los Usuarios:** Desperfectos físicos, extravío, obsolescencia o configuraciones particulares en tabletas de docentes, celulares particulares de los padres de familia o computadoras del colegio.
4. **Manipulación no Autorizada:** Daños en el sistema o bases de datos derivados de alteraciones directas a la configuración del servidor efectuadas por personal ajeno a **"EL PRESTADOR"**.

---

#### CLÁUSULA SEXTA. VIGENCIA, RENOVACIÓN Y POLÍTICA DE RESCISIÓN
1. **Vigencia Inicial:** El presente contrato tendrá una vigencia ordinaria de **12 (doce) meses** (o la duración del Ciclo Escolar 2026–2027), contados a partir de la fecha de suscripción.
2. **Renovación:** Al término de su vigencia, el contrato se renovará automáticamente por periodos iguales de un año, salvo que cualquiera de las partes notifique por escrito a la otra su deseo de no renovarlo con al menos **30 (treinta) días naturales** de anticipación.
3. **Terminación Anticipada:** Cualquiera de las partes podrá dar por terminado el contrato de forma anticipada mediante notificación por escrito con 30 días de anticipación, debiendo **"EL CLIENTE"** liquidar las mensualidades vencidas o devengadas a la fecha.
4. **Protocolo de Entrega de Datos al Cierre (Cero Retención Indebida):** En caso de terminación del servicio por cualquier causa, **"EL PRESTADOR"** se compromete a entregar a **"LA INSTITUCIÓN"** una copia íntegra y descargable del último respaldo de la base de datos PostgreSQL con todo el historial estudiantil y registros de entrega, garantizando que el colegio preserve la propiedad total de su información sin costos de extracción.

---

#### CLÁUSULA SÉPTIMA. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS PERSONALES
Ambas partes reconocen que la base de datos de **IIT-Pickup** contiene datos personales de menores de edad y tutores familiares. **"EL PRESTADOR"** se obliga a mantener estricto secreto profesional y confidencialidad respecto a la información procesada, comprometiéndose a no divulgar, vender, transferir ni utilizar dichos datos para propósitos ajenos a la operación y mantenimiento del sistema, en estricto cumplimiento con la *Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)*.

---

#### CLÁUSULA OCTAVA. JURISDICCIÓN Y RESOLUCIÓN DE CONTROVERSIAS
Para la interpretación, cumplimiento o resolución de cualquier controversia emanada del presente contrato, las partes se someten expresamente a la legislación civil aplicable y a la jurisdicción de los Tribunales Competentes con sede en la ciudad de **Toluca de Lerdo, Estado de México**, renunciando a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.

---

### FIRMAS Y CONFORMIDAD

Enteradas plenamente las partes del valor, alcance, fuerza y trascendencia legal del presente instrumento, lo firman por duplicado de común acuerdo, en la ciudad de Toluca de Lerdo, Estado de México, el día _____ de ____________________ de 2026.

<br><br>

```
                  POR "EL CLIENTE"                                      POR "EL PRESTADOR"
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
        Cargo: Coordinación Administrativa /                     Cargo: Dirección de Tecnologías /
               Operativa Escolar                                        Control Escolar
        Nombre: ________________________________                 Nombre: ________________________________
```
