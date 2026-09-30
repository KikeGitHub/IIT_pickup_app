# 📊 REPORTE TÉCNICO Y FUNCIONAL DETALLADO
### **Módulo de Maestros, Monitores y Gestión de Entregas**
**Sistema:** IIT Pickup App • **Versión:** 2.5 • **Instituto Inglés Torat** • **Fecha de Auditoría:** Septiembre 2026

---

> **Resumen Ejecutivo:**  
> Este documento detalla la arquitectura, flujos operativos, catálogo de servicios REST, contratos WebSocket y esquema de persistencia que sustentan las funcionalidades para el personal docente y monitores escolares del Instituto Inglés Torat. Se analizan los mecanismos de seguridad, trazabilidad de entregas, restablecimiento de credenciales y resiliencia ante contingencias de red.

---

## 🏛️ 1. Arquitectura del Sistema y Roles

El ecosistema de IIT Pickup opera bajo un esquema desacoplado y reactivo:

- **Frontend:** Angular 17+ con Signals reactivos, `ChangeDetectionStrategy.OnPush`, WebSockets sobre STOMP/SockJS, Web Audio API y PWA.
- **Backend:** Spring Boot 3.x, Spring Security (JWT), Spring Data JPA (Hibernate), STOMP Message Broker.
- **Persistencia:** PostgreSQL 15 gestionado mediante migraciones Flyway (V1 a V9).

### 1.1 Matriz de Roles y Autorización (RBAC)

| Rol del Usuario | Ámbito de Operación | Permisos Clave |
| :--- | :--- | :--- |
| **`ROLE_TEACHER`** | Salón o Nivel Asignado | Consulta de grupos asignados, alta y edición de alumnos, restablecimiento de contraseña temporal de tutores (`IIT2026`), despacho individual de alumnos en puerta. |
| **`ROLE_MONITOR`** | Patio Escolar / Puertas | Tablero de monitoreo general en tiempo real, despacho individual y masivo, reversión de entregas erróneas, modo pantalla completa (TV 80"). |
| **`ROLE_ADMIN`** | Colegio Completo | Acceso irrestricto a todos los grupos, importación masiva CSV de alumnos/docentes, auditoría de bitácora diaria y reversiones. |
| **`ROLE_PARENT`** | Alumnos Vinculados | Emisión de alertas (10m, 5m, En Fila, Urgente), confirmación de recepción física, reporte de no recepción, auto-confirmación ("Ya me entregaron"). |

---

## 🔄 2. Ciclo de Vida de la Entrega y Máquina de Estados

### 2.1 Descripción de Estados de `DeliveryLog`:

| Estado | Origen | Descripción y Consecuencia |
| :--- | :--- | :--- |
| **`ENTREGADO_ESCUELA`** | Docente | El docente confirma que el alumno está en la puerta. Se notifica al celular del padre vía WebSocket privado y se abre el modal de confirmación en su pantalla. |
| **`RECIBIDO_PADRE`** | Padre | **Estado terminal exitoso.** El padre confirma que ya tiene consigo al alumno (ya sea por confirmación del modal o por el botón de auto-servicio *"Ya me entregaron"*). |
| **`RECHAZADO_PADRE`** | Padre | El padre reporta que no ha recibido al alumno. El sistema reactiva automáticamente la alerta del alumno en estado **`URGENTE`** con insignia roja parpadeante en el monitor. |
| **`REVERTIDO_DOCENTE`** | Docente/Admin | Acción correctiva. Deshace un despacho erróneo, cerrando el modal en el teléfono del padre y regresando al alumno a la fila activa en el tablero. |

---

## 🛠️ 3. Catálogo de Endpoints REST (Módulo Docentes y Entregas)

Todos los endpoints protegidos requieren el encabezado: `Authorization: Bearer <JWT_TOKEN>`.

### 3.1 Gestión de Alumnos y Grupos (`/api/v1/teacher`)

- `GET /api/v1/teacher/my-groups`: Obtener grupos asignados al maestro con sus alumnos, tutores y padres.
- `POST /api/v1/teacher/students`: Registro de nuevo alumno con foto, tutores y cuenta de padre.
- `PUT /api/v1/teacher/students/{studentId}`: Edición de datos generales, CURP, foto y tutores.
- `PATCH /api/v1/teacher/students/{studentId}/toggle-active`: Activar o desactivar alumno (baja temporal).
- `POST /api/v1/teacher/parents/{parentId}/reset-temp-password`: Restablece contraseña de tutor a `IIT2026` con `tempPassword = true`.

### 3.2 Gestión del Ciclo de Entregas (`/api/v1/deliveries`)

- `GET /api/v1/deliveries/today`: Entregas del día (excluye revertidas).
- `POST /api/v1/deliveries/{alertId}/dispatch`: Docente despacha alumno en puerta (`ENTREGADO_ESCUELA`).
- `POST /api/v1/deliveries/{deliveryId}/parent-confirm`: Padre confirma recepción en modal (`RECIBIDO_PADRE`).
- `POST /api/v1/deliveries/parent-self-confirm`: 🆕 Padre auto-confirma entrega física cuando el docente no presionó el botón en la tableta. Cierra el ciclo con evidencia en BD y notifica a monitores vía WebSocket.
- `POST /api/v1/deliveries/{deliveryId}/parent-reject`: Padre rechaza entrega; alerta regresa como `URGENTE`.
- `POST /api/v1/deliveries/{deliveryId}/revert`: Docente revierte entrega; alumno regresa a `EN_FILA`.
- `GET /api/v1/deliveries/student/{studentId}/today-events`: Cronología completa de eventos del día para auditoría.

---

## 🗄️ 4. Modelo de Datos y Evidencia en Base de Datos

Tabla `delivery_logs`:

```sql
CREATE TABLE delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    teacher_name VARCHAR(150),
    pickup_method VARCHAR(20) CHECK (pickup_method IN ('CAR', 'WALK')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('ENTREGADO_ESCUELA', 'RECIBIDO_PADRE', 'RECHAZADO_PADRE', 'REVERTIDO_DOCENTE')),
    teacher_confirmed_at TIMESTAMPTZ,
    parent_confirmed_at TIMESTAMPTZ,
    parent_rejected_at TIMESTAMPTZ,
    reverted_at TIMESTAMPTZ,
    reverted_by VARCHAR(150),
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT uq_student_delivery_date UNIQUE (student_id, log_date)
);
```

### Matriz de Evidencia:
- En auto-confirmación del padre (`parent-self-confirm`): `teacher_name` se registra como `"Entrega en puerta (Confirmada por Padre)"`, `status = RECIBIDO_PADRE`, `parent_confirmed_at = NOW()`, garantizando certeza legal de recepción.

---

## ⚡ 5. Resiliencia, Audio y Optimización de Patio

1. **Anti-Flicker de Cards:** Ante microcortes de Wi-Fi, la interfaz conserva las tarjetas en pantalla sin parpadear.
2. **Web Audio Unlocking:** Garantiza audio de llegada aun en iOS/Safari con pantalla bloqueada tras desbloqueo inicial.
3. **Modo TV (80"):** Vista para pantallas de patio sin bordes ni elementos distractores.
4. **Cloudinary AI Face Detection:** Recorte centrado en rostro (`g_face`) para identificación inmediata en puerta.

---

**Colegio Instituto Inglés Torat • Departamento de Tecnologías de la Información**
