# Propuesta Técnica y Comercial
## Sistema de Logística de Entrega de Alumnos: **Stitch Pickup**

**Preparado para:** Directiva del Instituto Inglés de Toluca  
**Preparado por:** Enrique Durán Jiménez – Consultor y Desarrollador de Software Sr.  
**Fecha:** Julio 2026  

---

### 1. Resumen Ejecutivo
El presente documento detalla la propuesta técnica y económica para la implementación del sistema **Stitch Pickup**, una plataforma web diseñada específicamente para optimizar, agilizar y asegurar el proceso de entrega de alumnos a la salida de las jornadas escolares.

El sistema resuelve la congestión vial y la incertidumbre de seguridad mediante un flujo de comunicación bidireccional en tiempo real: los padres notifican su proximidad (10 min, 5 min, "en fila") desde sus dispositivos móviles y el personal escolar visualiza y gestiona las prioridades de salida desde un monitor central.

---

### 2. Alcance del Proyecto (Qué Incluye)

La solución propuesta consta de tres componentes principales totalmente integrados:

#### A. Aplicación Móvil para Padres (Mobile Portal)
*   **Acceso Seguro:** Pantalla de inicio de sesión individual mediante correo electrónico y contraseña (deshabilitación instantánea de cuentas en caso de baja).
*   **Políticas de Seguridad:** Flujo de cambio obligatorio de contraseña en el primer acceso (eliminación de contraseñas genéricas).
*   **Gestión Multi-hijo:** Selector dinámico que filtra y muestra únicamente a los alumnos vinculados a ese tutor.
*   **Alertas de Proximidad en Tiempo Real:** Botones rápidos de aviso (Estoy a 10 min / Estoy a 5 min / Llegué a la fila).
*   **Alerta de Demora (Urgente):** Botón de pánico/demora si el padre ya está en fila pero se retrasa, notificando de inmediato a los maestros.
*   **Historial Diario:** Bitácora visual de los avisos enviados en el día con confirmación de entrega del alumno.

#### B. Panel de Operación y Monitoreo Escolar (Desktop Dashboard)
*   **Bento-Grid de Monitoreo:** Monitor dinámico en tiempo real que organiza a los alumnos por nivel de proximidad y hora de aviso, ordenando prioritariamente a los alumnos cuyos padres ya están físicamente en la fila.
*   **Alertas Audibles y Visuales:** Tonos melódicos y tarjetas parpadeantes para notificaciones urgentes (demoras o avisos de última hora).
*   **Filtros Rápidos:** Clasificación instantánea de alumnos por nivel académico (Kínder, Primaria, Secundaria) y grupos escolares para facilitar el llamado.
*   **Registro de Salidas:** Botón de despacho rápido y bitácora de alumnos entregados exitosamente.

#### C. Módulo de Super Administración (Super Admin Portal)
*   **Control de Accesos:** Creación, edición, suspensión y restablecimiento de contraseñas de cuentas de padres.
*   **Asociación de Alumnos:** Interfaz visual para vincular alumnos a uno o varios tutores.
*   **Configuración Escolar:** Gestión del catálogo de grados, grupos y niveles académicos activos.
*   **Carga Masiva de Datos:** Importador inteligente basado en archivos Excel/CSV para dar de alta plantillas completas de alumnos y familiares autorizados con un solo clic.

---

### 3. Arquitectura y Escalabilidad (Preparado para el Futuro)
> [!NOTE]
> **Listo para Integración Backend**  
> El sistema frontend actual se entrega con una capa de servicios simulados utilizando almacenamiento local (`localStorage`) que lo hace 100% funcional e interactivo para demostraciones inmediatas.  
> La estructura de código está desacoplada siguiendo las mejores prácticas (firmas de servicio idénticas a las llamadas REST de Spring Boot), lo que garantizará una transición rápida y económica hacia la base de datos central en la segunda etapa del proyecto.

---

### 4. Propuesta Económica y Condiciones de Pago

La inversión total requerida para el desarrollo, configuración y entrega del sistema completo de logística escolar bajo los alcances descritos es de:

| Concepto | Monto |
| :--- | :--- |
| **Desarrollo y Licencia del Sistema Stitch Pickup** | **$30,000.00 MXN** *(Treinta mil pesos 00/100 M.N.)* |

#### Esquema de Pago (50 / 50)
*   **50% Inicial (Anticipo):** **$15,000.00 MXN** al momento de la firma de conformidad y arranque de los trabajos.
*   **50% Final (Finiquito):** **$15,000.00 MXN** contra entrega completa del sistema, pruebas de aceptación finales y capacitación al personal operativo.

---

### 5. Tiempos de Entrega
*   **Instalación de Demo Funcional:** Inmediato (para validación de flujos).
*   **Pruebas End-to-End y Ajustes de Imagen Institucional:** 5 días hábiles a partir del anticipo.
*   **Entrega Final del Sistema de Escritorio y Móvil:** 10 días hábiles.

---

### Aceptación y Conformidad

Para proceder con la contratación e inicio del proyecto, se requiere la firma del representante autorizado.

```
__________________________________              __________________________________
Por el Instituto Inglés de Toluca               Enrique Durán Jiménez
Cliente                                         Consultor de Software Sr.
```
