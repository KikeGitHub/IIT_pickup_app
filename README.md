# 🚗 IIT Pickup — Sistema de Logística y Despacho Escolar

Sistema de recogida de alumnos y gestión de tráfico en tiempo real para el **Instituto Inglés de Toluca (IIT)**.
Permite a los padres de familia notificar su proximidad al plantel mediante geolocalización o disparo manual, y a los docentes/personal operativo gestionar el flujo de entrega de alumnos mediante un monitor interactivo en tiempo real con WebSocket STOMP.

---

## 🚀 Deployment en Hetzner Cloud & Dominio Institucional

### Infraestructura de Producción
La aplicación se encuentra desplegada en un servidor **Hetzner Cloud (CPX22 - 4 GB RAM)** bajo el dominio institucional seguro:

- **Dominio Oficial:** [https://pickup.institutoingles.edu.mx](https://pickup.institutoingles.edu.mx)
- **IP Pública del Servidor:** `5.161.82.24` (Hetzner Cloud)
- **Gestión DNS:** cPanel Zone Editor (Registro A `pickup` ➡️ `5.161.82.24`)
- **Certificado SSL/TLS:** Let's Encrypt con renovación automatizada por Certbot hook
- **Protocolos de Seguridad:** HTTPS / HTTP/2, HSTS (`max-age=31536000`), Redirección Forzada 301 (HTTP ➡️ HTTPS)
- **Sistema Operativo:** Ubuntu 24.04 LTS (Noble Numbat)
- **Ruta de Despliegue:** `/opt/iit_pickup`
- **Contenedores:** Docker & Docker Compose v2
- **Base de Datos:** PostgreSQL 16 (Alpine) con volumen persistente `pgdata`
- **Backend:** Spring Boot 3.3.5 con OpenJDK 21 (Temurin Alpine) y GC optimizado (`-XX:+UseG1GC`)
- **Frontend:** Angular 20 SPA servido por Nginx Alpine (Reverse Proxy, SSL, Gzip y WebSockets STOMP)
- **Seguridad Perimetral:** UFW Firewall (puertos 22, 80 y 443)

### Arquitectura de Red, Dominio y Contenedores

```text
                                INTERNET
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
        HTTP :80 (Redirect 301)                  HTTPS :443 (SSL/TLS)
              │                                         │
              └────────────────────┬────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │        Angular + Nginx        │
                   │        stitch-frontend        │
                   │    pickup.institutoingles.    │
                   │            edu.mx             │
                   └───────────────┬───────────────┘
                                   │
                           Docker Network
                         (stitch-network)
                                   │
                   ┌───────────────▼───────────────┐
                   │         Spring Boot           │
                   │        stitch-backend         │
                   │             :8080             │
                   └───────────────┬───────────────┘
                                   │
                           Docker Network
                         (stitch-network)
                                   │
                   ┌───────────────▼───────────────┐
                   │          PostgreSQL           │
                   │        stitch-postgres        │
                   │             :5432             │
                   └───────────────────────────────┘
```

> **🔒 Principio de Menor Exposición:**
> Los contenedores de `PostgreSQL` y `Spring Boot` **no exponen puertos al Internet**. Únicamente el contenedor de `Nginx` (Frontend) expone los puertos `80` (redirección) y `443` (HTTPS/WSS), redirigiendo de forma interna las peticiones REST (`/api/`) y WebSocket (`/ws/`) al backend dentro de la red aislada `stitch-network`.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías | Descripción |
|---|---|---|
| **Frontend** | Angular 20, TypeScript, SCSS, RxJS, Angular Signals | SPA reactiva y PWA optimizada para móviles y tablets |
| **Tiempo Real** | `@stomp/stompjs` v7, SockJS | Comunicación bidireccional STOMP sobre WebSockets seguros (`wss://`) |
| **Backend** | Spring Boot 3.3.5, Java 21, Spring Security, Spring Data JPA | API REST y broker de mensajería WebSocket |
| **Base de Datos** | PostgreSQL 16, Flyway Migrations | Migraciones versionadas DDL e inserts homologados |
| **Infraestructura & SSL** | Docker, Nginx, Let's Encrypt, Hetzner Cloud | Despliegue contenerizado con reverse proxy, SSL/TLS y compresión gzip |

---

## 🌐 URLs de Acceso en Producción

* **Portal de Padres:** 👉 [https://pickup.institutoingles.edu.mx/auth/login](https://pickup.institutoingles.edu.mx/auth/login)
* **Portal de Maestros & Admin:** 👉 [https://pickup.institutoingles.edu.mx/auth/maestros](https://pickup.institutoingles.edu.mx/auth/maestros)
* **Monitor de Entregas (Circuito):** 👉 [https://pickup.institutoingles.edu.mx/monitor](https://pickup.institutoingles.edu.mx/monitor)
* **Panel de Control Admin:** 👉 [https://pickup.institutoingles.edu.mx/admin](https://pickup.institutoingles.edu.mx/admin)

---

## 👥 Cuentas de Acceso (Credenciales)

| Rol | Usuario / Correo | Contraseña | Destino Principal |
|---|---|---|---|
| 👑 **Super Admin** | `admin@iit.edu.mx` | `admin2026` | Panel de Control (`/admin`) |
| 👔 **Director Primaria** | `perez.rojas@iit.edu.mx` | `ITT2026` | Panel de Control (`/admin`) |
| 💻 **Admin Plataforma** | `alva.flores@iit.edu.mx` | `ITT2026` | Panel de Control (`/admin`) |
| 👨‍🏫 **Profesor (6A)** | `alva.ortiz@iit.edu.mx` | `ITT2026` | Monitor de Entregas (`/monitor`) |
| 👨‍🏫 **Profesor (4C)** | `angeles.hidalgo@iit.edu.mx` | `ITT2026` | Monitor de Entregas (`/monitor`) |
| 👨‍👩‍👧 **Padres de Familia** | Usuario asignado (Ej: `JPEREZ`) | `IIT2026` | Portal de Padres (`/auth/login`) |

---

## 📦 Comandos de Despliegue y Mantenimiento en el Servidor

```bash
# 1. Entrar a la carpeta del proyecto en Hetzner
cd /opt/iit_pickup

# 2. Actualizar el código desde GitHub
git pull origin develop

# 3. Compilar y levantar contenedores en segundo plano
docker compose up -d --build

# 4. Verificar salud de los servicios
docker compose ps
docker compose logs -f frontend backend

# 5. Renovación de Certificados SSL (Automatizada)
# El cron/timer del sistema renueva los certificados y recarga Nginx mediante el hook:
# /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
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
