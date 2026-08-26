# 🚗 Stitch Pickup — Sistema de Logística y Despacho Escolar

Sistema de recogida de alumnos y gestión de tráfico en tiempo real para el **Instituto Inglés de Toluca (IIT)**.
Permite a los padres de familia notificar su proximidad al plantel mediante geolocalización o disparo manual, y a los docentes/personal operativo gestionar el flujo de entrega de alumnos mediante un monitor interactivo en tiempo real con WebSocket STOMP.

---

## 🚀 Deployment en Hetzner Cloud

### Infraestructura de Producción
La aplicación se encuentra desplegada en un servidor **Hetzner Cloud (CPX22 - 4 GB RAM)** con la siguiente configuración:

- **Sistema Operativo:** Ubuntu 24.04 LTS (Noble Numbat)
- **Contenedores:** Docker & Docker Compose v2
- **Base de Datos:** PostgreSQL 16 (Alpine) con volumen persistente `pgdata`
- **Backend:** Spring Boot 3.3.5 con OpenJDK 21 (Temurin Alpine) y GC optimizado (`-XX:+UseG1GC`)
- **Frontend:** Angular 19/20 SPA servido por Nginx Alpine (Reverse Proxy & Gzip)
- **Seguridad Perimetral:** UFW Firewall (solo puertos 22 y 80 abiertos hacia el exterior)
- **Acceso:** SSH autenticado mediante llave criptográfica Ed25519

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

## 🛠️ Stack Tecnológico

| Capa | Tecnologías | Descripción |
|---|---|---|
| **Frontend** | Angular 20, TypeScript, SCSS, RxJS, Angular Signals | SPA reactiva y PWA optimizada para móviles y tablets |
| **Tiempo Real** | `@stomp/stompjs` v7, SockJS | Comunicación bidireccional STOMP sobre WebSockets |
| **Backend** | Spring Boot 3.3.5, Java 21, Spring Security, Spring Data JPA | API REST y broker de mensajería WebSocket |
| **Base de Datos** | PostgreSQL 16, Flyway Migrations | Migraciones versionadas DDL e inserts homologados |
| **Infraestructura** | Docker, Nginx, Hetzner Cloud | Despliegue contenerizado con reverse proxy y compresión gzip |

---

## 🌐 URLs de Acceso en Producción

* **Portal de Padres:** 👉 [http://5.161.82.24/auth/login](http://5.161.82.24/auth/login)
* **Portal de Maestros & Admin:** 👉 [http://5.161.82.24/auth/maestros](http://5.161.82.24/auth/maestros)
* **Monitor de Entregas (Circuito):** 👉 [http://5.161.82.24/monitor](http://5.161.82.24/monitor)
* **Panel de Control Admin:** 👉 [http://5.161.82.24/admin](http://5.161.82.24/admin)

---

## 👥 Cuentas de Acceso (Credenciales)

| Rol | Usuario / Correo | Contraseña | Destino Principal |
|---|---|---|---|
| 👑 **Super Admin** | `admin@iit.edu.mx` | `admin2026` | Panel de Control (`/admin`) |
| 👔 **Director Primaria** | `perez.rojas@iit.edu.mx` | `ITT2026` | Panel de Control (`/admin`) |
| 💻 **Admin Plataforma** | `alva.flores@iit.edu.mx` | `ITT2026` | Panel de Control (`/admin`) |
| 👨‍🏫 **Profesor (6A)** | `alva.ortiz@iit.edu.mx` | `ITT2026` | Monitor de Entregas (`/monitor`) |
| 👨‍🏫 **Profesor (4C)** | `angeles.hidalgo@iit.edu.mx` | `ITT2026` | Monitor de Entregas (`/monitor`) |
| 👨‍👩‍👧 **Padre de Familia** | `carlos.ramirez@iit.edu.mx` | `demo1234` | Portal de Padres (`/parent`) |

---

## 📦 Comandos de Despliegue en el Servidor

```bash
# 1. Clonar o actualizar el repositorio
cd /opt/iit_pickup
git pull origin main

# 2. Configurar variables de entorno (solo la primera vez)
cp .env.example .env
nano .env

# 3. Compilar y levantar contenedores en segundo plano
docker compose up -d --build

# 4. Verificar salud de los servicios
docker compose ps
docker compose logs -f backend
```

---

## 📜 Decisiones de Arquitectura (ADR)

### ADR-001: JWT Stateless & Separación de Roles
El servidor no persiste sesiones en base de datos. El token JWT contiene los claims de rol (`PARENT`, `TEACHER`, `ADMIN`) y los IDs de grupos/alumnos vinculados, reduciendo las consultas a base de datos en peticiones recurrentes.

### ADR-002: Offline-First con IndexedDB
Las alertas generadas por los padres se guardan localmente en IndexedDB si el dispositivo pierde conectividad 4G/WiFi. Al recuperar la conexión, el servicio de sincronización reintenta la entrega garantizando idempotencia mediante UUIDs únicos.

### ADR-003: WebSocket STOMP sobre SockJS
La comunicación en tiempo real entre el portal de padres, el servidor y las pantallas del monitor utiliza el protocolo STOMP sobre WebSockets con SockJS como fallback y auto-reconexión a los 5 segundos.

### ADR-004: Paginación en Grids Administrativos y Bloqueo de Pantalla (Loading Overlay)
- **Paginación Dinámica:** Las tablas administrativas (Alumnos, Padres, Maestros) implementan paginación reactiva con selector de **15, 30 y 100** registros por página, recálculo reactivo y reseteo automático a la página 1 al filtrar.
- **Bloqueo en Transacciones:** Las operaciones de creación, edición, borrado o importación masiva CSV activan un overlay modal con `backdrop-filter: blur` y spinner que inhabilita la interfaz hasta confirmar respuesta del servidor para evitar duplicidad de envíos.
