# LogOS

Microservicio independiente de captura inteligente de notas, logging estructurado e integración con sistemas externos (Google Calendar, Discriminador).

## Arquitectura

```
[PWA React/Vite :5173] ──► [LogOS API Node/Express :3001] ──► [PostgreSQL schema: logos]
                                        │
                          ┌─────────────┼──────────────┐
                          ▼             ▼               ▼
                   [Claude API     [Google Calendar  [Discriminador
                    tool use]       API v3]           REST API]
```

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- API key de Anthropic

## Levantar el backend

```bash
cd backend
cp .env.example .env
# Completar DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
npm install
```

### Correr la migración

```bash
npm run migrate
```

O manualmente:

```bash
psql $DATABASE_URL -f migrations/001_init.sql
```

### Iniciar el servidor

```bash
npm run dev      # con hot-reload (nodemon)
npm start        # producción
```

El servidor escucha en `http://localhost:3001`.

## Levantar la PWA

```bash
cd pwa
cp ../.env.example .env     # solo necesita VITE_API_BASE_URL
npm install
npm run dev
```

La PWA corre en `http://localhost:5173`.

## Variables de entorno (backend)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 3001) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secreto compartido con Discriminador |
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `GOOGLE_CLIENT_ID` | OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth2 client secret |
| `GOOGLE_REDIRECT_URI` | Callback URI para OAuth2 |
| `GOOGLE_ACCESS_TOKEN` | Token mock para fase de desarrollo |
| `GOOGLE_REFRESH_TOKEN` | Refresh token mock |
| `DISCRIMINADOR_BASE_URL` | Base URL del Discriminador |

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/logs` | Procesa una entrada libre con Claude |
| `GET` | `/api/logs` | Historial paginado con `?limit=&offset=&type=&tags=` |
| `GET` | `/api/memory` | Resumen de memoria del usuario |
| `DELETE` | `/api/memory` | Resetea la memoria |
| `GET` | `/api/integrations/status` | Estado de integraciones |
| `GET` | `/health` | Health check (sin auth) |

Todos los endpoints (excepto `/health`) requieren `Authorization: Bearer <token>`.

## Auth federada

El middleware acepta JWTs firmados con `JWT_SECRET`. En el primer request de un usuario nuevo, crea automáticamente el registro en `logos.users` y `logos.federated_identities`. Compatible con tokens emitidos por el Discriminador.

## Google Calendar — estado actual (mock)

El adapter de Google Calendar funciona con tokens provistos vía variables de entorno (`GOOGLE_ACCESS_TOKEN`, `GOOGLE_REFRESH_TOKEN`). El flow OAuth2 completo (callback `/api/auth/google/callback`) está marcado con `TODO` en `google-calendar.adapter.js` y pendiente de implementación.

## Agregar una nueva integración

1. Crear `backend/src/services/integrations/nueva-app.adapter.js` con `push()` y `pull()`
2. Registrar en `registry.js`
3. Agregar la tool correspondiente en `tools/definitions.js`
4. Manejar el case en `claude.service.js → executeTool()`
