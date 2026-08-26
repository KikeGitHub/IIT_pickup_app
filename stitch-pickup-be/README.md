# Stitch Pickup — Sistema de Logística Escolar

Sistema de recogida de alumnos en tiempo real para el **Instituto Inglés de Toluca (IIT)**.
Permite a padres de familia notificar su proximidad al plantel, y a maestros/guardias gestionar el flujo de entrega mediante un panel en tiempo real con WebSocket.

---

## 🚀 Deployment en Hetzner Cloud

### Infraestructura
La aplicación está desplegada en un servidor **Hetzner Cloud (CPX22 - 4 GB RAM)** con:

- Ubuntu 24.04 LTS
- Docker & Docker Compose v2
- PostgreSQL 16 (Alpine)
- Spring Boot 3.3.5 + OpenJDK 21 (Temurin Alpine)
- Angular 20 + Nginx Alpine
- UFW Firewall (solo puertos 22 y 80 accesibles externamente)
- SSH autenticado mediante Ed25519

### Arquitectura de Red y Contenedores

```text
                         INTERNET
                            │
                            │ HTTP :80
                            ▼
                  ┌─────────────────────┐
                  │   Angular + Nginx   │
                  │   stitch-frontend   │
                  │        :80          │
                  └──────────┬──────────┘
                             │
                     Docker Network
                       (Interna)
                             │
                  ┌──────────▼──────────┐
                  │    Spring Boot      │
                  │   stitch-backend    │
                  │        :8080        │
                  └──────────┬──────────┘
                             │
                     Docker Network
                       (Interna)
                             │
                  ┌──────────▼──────────┐
                  │     PostgreSQL      │
                  │   stitch-postgres   │
                  │        :5432        │
                  └─────────────────────┘
```

> **🔒 Principio de Menor Exposición:**
> Los contenedores de `PostgreSQL` y `Spring Boot` **no exponen puertos al Internet**. Únicamente el contenedor de `Nginx` (Frontend) expone el puerto `80`, redirigiendo el tráfico de API (`/api/`) y WebSocket (`/ws/`) al backend dentro de la red aislada `stitch-network`.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                      STITCH PICKUP                              │
│                                                                 │
│  ┌─────────────────┐   REST / STOMP    ┌────────────────────┐  │
│  │   Angular 20    │◄─────────────────►│  Spring Boot 3.3   │  │
│  │   (PWA / SPA)   │                   │   (Java 17)        │  │
│  │                 │   WebSocket       │                    │  │
│  │  Portal Padre   │◄── /topic/alerts ─│  PostgreSQL 15     │  │
│  │  Monitor IIT    │                   │  Flyway 10         │  │
│  │  Admin Panel    │                   │  JWT Stateless     │  │
│  └─────────────────┘                   └────────────────────┘  │
│         │ IndexedDB                                             │
│         │ (Offline Queue ADR-002)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Stack Tecnológico

### Frontend (`stitch-pickup-fe`)
| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 20 | Framework principal |
| Angular Signals | Built-in | Estado reactivo |
| @stomp/stompjs | 7 | WebSocket STOMP client |
| SockJS | 1.6 | WS fallback para proxies |
| idb (IndexedDB) | 8 | Cola offline persistente |
| Hanken Grotesk | Google Fonts | Tipografía del sistema |
| SCSS | Built-in | Estilos + Design Tokens |

### Backend (`stitch-pickup-be`)
| Tecnología | Versión | Uso |
|---|---|---|
| Spring Boot | 3.3.5 | Framework web |
| Spring Security | 6.3 | JWT stateless |
| Spring WebSocket | 6.1 | STOMP broker |
| JJWT | 0.12.6 | JWT parsing/signing |
| Flyway | 10 | Migraciones DB |
| PostgreSQL | 15+ | Base de datos |
| Lombok | 1.18.34 | Boilerplate reducción |
| springdoc-openapi | 2.6 | Swagger UI |
| Java | 17 | Runtime |

---

## 🚀 Levantamiento Local

### Requisitos Previos
- **JDK 17** (no 21)
- **Node.js 20+** + npm
- **PostgreSQL 15+** corriendo localmente
- **Maven 3.9+**

### 1. Base de Datos
```sql
CREATE DATABASE stitch_pickup;
```

### 2. Backend
```bash
# Clonar / ir al directorio
cd stitch-pickup-be

# Configurar variables de entorno (o editar application.yml)
# DB_HOST=localhost, DB_PORT=5432, DB_NAME=stitch_pickup
# DB_USERNAME=postgres, DB_PASSWORD=tu_password
# JWT_SECRET=mínimo-64-caracteres-de-secreto

# Compilar y arrancar
mvn spring-boot:run
```

El servidor arranca en `http://localhost:8080`.
Flyway ejecuta automáticamente V1–V6 al iniciar.

**Swagger UI:** `http://localhost:8080/swagger-ui.html`

### 3. Frontend
```bash
cd stitch-pickup-fe
npm install
npm run start -- --port 3000 --configuration development
```

App disponible en `http://localhost:3000`.

---

## 📡 API REST Endpoints

### Auth
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/auth/parent/login` | 🔓 Público | Login padre |
| `POST` | `/api/v1/auth/teacher/login` | 🔓 Público | Login maestro |
| `POST` | `/api/v1/auth/parent/change-password` | 🔒 PARENT | Cambio contraseña |
| `POST` | `/api/v1/auth/teacher/change-password` | 🔒 TEACHER | Cambio contraseña |
| `GET` | `/api/v1/auth/me` | 🔒 Auth | Perfil del usuario |

### Alumnos
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/students/my-students` | 🔒 PARENT | Alumnos vinculados al padre |

### Alertas
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/alerts` | 🔒 PARENT | Emitir alerta de proximidad |
| `GET` | `/api/v1/alerts/today` | 🔒 TEACHER | Alertas del día |

### Entregas
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/deliveries/today` | 🔒 TEACHER | Entregas del día |
| `POST` | `/api/v1/deliveries/{alertId}/dispatch` | 🔒 TEACHER | Maestro confirma entrega |
| `POST` | `/api/v1/deliveries/{id}/parent-confirm` | 🔒 PARENT | Padre confirma recepción |

### Admin
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/kpis/today` | 🔒 ADMIN | KPIs y métricas del día |
| `POST` | `/api/v1/admin/import/students` | 🔒 ADMIN | Carga masiva CSV |

---

## 🔌 WebSocket (STOMP)

**Endpoint de conexión:** `ws://localhost:8080/ws` (SockJS fallback)

**Autenticación:** Header STOMP `Authorization: Bearer {token}`

| Tópico | Dirección | Descripción |
|---|---|---|
| `/topic/alerts` | Servidor → Monitor | Nueva alerta de padre |
| `/topic/deliveries` | Servidor → Monitor/Padre | Alumno despachado en puerta |
| `/user/{id}/queue/delivery` | Servidor → Padre específico | Notificación privada de entrega |

---

## 📱 PWA (Progressive Web App)

La app está configurada como PWA con Service Worker (`ngsw-config.json`):

- **App Shell** — Precargada en instalación
- **Assets** — Lazy + re-validación en actualizaciones
- **API Cache:**
  - Auth: `freshness` (1 min)
  - Alumnos: `performance` (10 min)
  - Alertas/Entregas: `freshness` (5 min)
  - KPIs: `performance` (15 min)
- **Offline Queue** — IndexedDB (`idb`) persiste alertas sin conexión con `clientId` UUID para deduplicación en el servidor (ADR-002)

---

## 🗄️ Esquema de Base de Datos

```
school_groups ──┐
                ├── students ──┬── parent_users (many-to-many)
                               ├── family_members
                               ├── alerts ──── delivery_logs
                               └── delivery_logs
teacher_users (autónomo)
```

**Migraciones Flyway:**
| Versión | Descripción |
|---|---|
| V1 | Schema completo (todas las tablas) |
| V2 | Grupos escolares por defecto (KB, 1A-6B, 1S-3S) |
| V3 | Alumnos demo (10 alumnos) |
| V4 | Usuarios padres demo (BCrypt cost 12) |
| V5 | Usuarios maestros demo + admin |
| V6 | Tablas `alerts`, `delivery_logs`, `family_members` + índices + demo data |

---

## 🎨 Design System

Tokens centralizados en [`src/styles/_variables.scss`](src/styles/_variables.scss):

- **Colores:** Navy Académico `#000e27` / Rojo Académico `#b6171e`
- **Tipografía:** Hanken Grotesk (Google Fonts) — Regular/SemiBold/Bold/ExtraBold
- **Grid de 8px** — espaciado: `xs:4` `sm:8` `md:16` `lg:32` `xl:64`
- **Radios:** `xs:2` `sm:4` `md:8` `lg:16` `xl:24` `2xl:32`
- **Sombras:** `xs` `sm` `md` `lg` `xl` `button` `modal`

---

## 🔐 Seguridad

- JWT **stateless** firmado con HMAC-SHA256
- Claims: `userId`, `email`, `role` (PARENT/TEACHER/ADMIN), `nombre`
- BCrypt **cost 12** para contraseñas
- CORS configurado para `localhost:3000` (dev) → dominio propio (prod)
- `@PreAuthorize` con Spring Security para autorización a nivel método
- `GlobalExceptionHandler` con `ProblemDetail` RFC 9457

---

## 📦 Módulos Frontend

```
src/app/
├── core/
│   ├── auth/          — Guards, JWT interceptor, modelos
│   ├── models/        — Student, Alert, interfaces compartidas
│   └── services/      — StudentService, AlertService, WebSocketService,
│                        ConnectivityService, OfflineQueueService,
│                        NotificationService
├── features/
│   ├── auth/          — Login padre, Login maestro, ChangePassword
│   ├── parent-portal/ — ParentDashboard + AlertButtons + StatusCard + History
│   ├── monitor/       — MonitorDashboard + StatsHeader + StudentCard + Dispatch
│   ├── teacher-portal/— TeacherDashboard (stub para fase 2)
│   └── admin/         — AdminShell + KpiDashboard + UserManagement + CsvImport
└── shared/
    └── components/
        └── toast-container/ — Sistema de notificaciones global
```

---

## 📜 Decisiones de Arquitectura (ADR)

### ADR-001: JWT Stateless
El servidor no persiste sesiones. El frontend almacena el token en `localStorage` y lo envía en `Authorization: Bearer {token}`. Los claims incluyen `studentIds` y `groupName` para evitar consultas adicionales durante la autenticación.

### ADR-002: Offline-First con IndexedDB
Las alertas se generan con un `clientId` UUID localmente antes de enviarse. Si el dispositivo está offline, la petición se encola en IndexedDB con `OfflineQueueService`. Al reconectarse, `ConnectivityService.online$` dispara `processQueue()` que reintenta cada item. El backend verifica el `clientId` para rechazar duplicados (idempotente).

### ADR-003: WebSocket STOMP sobre SockJS
Se usa `@stomp/stompjs` v7 (moderno, tree-shakeable) con SockJS como fallback para entornos con proxies HTTP que bloquean WebSocket puro. El `WebSocketService` maneja auto-reconexión con delay de 5s, y el `NotificationPublisher` del backend centraliza toda la emisión.

### ADR-004: Paginación de Grids Administrativos y Bloqueo de Pantalla en Transacciones (Loading Overlay)
- **Contexto:** La base de datos contiene más de 1,304 alumnos, 1,160 padres de familia y 50 profesores. Renderizar miles de elementos directamente en el DOM causaría congelamiento de interfaz y consumo innecesario de memoria.
- **Decisión:** 
  1. Implementar paginación reactiva en el Frontend con selección de tamaño de página (15, 30 y 100 registros por página, predeterminado 15) con recálculo automático de página activa al filtrar o buscar.
  2. Implementar un componente global de bloqueo de pantalla (`LoadingOverlayComponent` con backdrop blur y spinner dual-ring) que inhabilita la interacción durante transacciones de creación, modificación, eliminación o importación masiva CSV, garantizando la idempotencia y evitando dobles envíos concurrentes.
  3. Barra de carga interactiva (`.table-loading-bar`) dentro de cada grid mientras se consultan los endpoints del servidor.

---

## 👥 Cuentas Demo

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Carlos Ramírez Soto | padre1@iit.edu.mx | demo1234 | PARENT |
| Roberto González Vidal | padre2@iit.edu.mx | demo1234 | PARENT |
| María Fernanda Solis | maestro1@iit.edu.mx | demo1234 | TEACHER |
| Prof. Luis Hernández | maestro2@iit.edu.mx | demo1234 | TEACHER |
| Director General | admin@iit.edu.mx | admin2026 | ADMIN |

---

## 📊 Estado del Proyecto

| Sprint | Estado | Descripción |
|---|---|---|
| Sprint 1 — Arquitectura Base | ✅ Completo | Angular 20 + Clean Architecture + Design System |
| Sprint 2 — Auth & Seguridad | ✅ Completo | JWT + Spring Security + Login FE/BE |
| Sprint 3 — Portal Padre | ✅ Completo | Alertas Offline-First + IndexedDB + WebSocket |
| Sprint 4 — Monitor Tiempo Real | ✅ Completo | Dashboard STOMP + KPIs + Dispatch |
| Sprint 5 — Super Admin | ✅ Completo | Panel KPIs + CSV Import + Gestión Usuarios |
| Sprint 6 — PWA & Pulido | ✅ Completo | Service Worker + Toast Global + Flyway V6 + Docs |

---

*Instituto Inglés de Toluca — Stitch Pickup v1.0.0 — 2026*
