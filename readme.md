# Backend Auth API

Eine vollständige Authentifizierungs- und Autorisierungs-API mit JWT-basiertem Token-Management, User-Rollen-System und Refresh-Token-Logik. Das Projekt bietet sichere Endpoints für Registrierung, Login, Logout und Admin-Management mit einer interaktiven Test-UI.

## Features

- **User-Registrierung** mit E-Mail und Passwort (bcrypt-gehashed)
- **Login** mit JWT Access & Refresh Token-Generierung
- **Logout** mit Refresh-Token-Revocation
- **Token-Refresh** zur Erneuerung des Access Tokens
- **Profil-Abruf** (`/me`) mit Authentifizierung geschützt
- **Admin-Management** mit Role-Based Access Control (RBAC)
  - Admin-Only Endpoint (`/admin`)
  - Benutzer zu Admin promoten (`/make-admin`)
- **Datenbankpersistenz** für User und Refresh Tokens
- **CORS-Unterstützung** für Frontend-Integration
- **Strukturierte API-Responses** mit standardisiertem Format
- **Interaktive Test-UI** zum manuellen Testen aller Endpoints

## Tech Stack

**Backend:**

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (Neon)
- JWT (JSON Web Tokens)
- bcrypt (Password Hashing)
- CORS

**Frontend:**

- TypeScript
- Vanilla HTML/CSS/JavaScript
- Fetch API

## Projektziel

Das Ziel des Projekts ist es, ein praxisnahes Auth-System zu entwickeln, das folgende Best Practices abbildet:

- Sichere Password-Verwaltung durch Hashing
- JWT-basierte Token-Authentifizierung mit kurzer Lebensdauer
- Refresh-Token-Rotation zur Erhöhung der Sicherheit
- Role-Based Access Control (ADMIN vs. USER)
- Standardisierte API-Responses und Error-Handling
- Vollständige Validierung von Input-Daten
- Persistierung von Refresh Tokens in der Datenbank (Token Revocation)

## Installation

### Backend

```bash
cd backend
npm install
npm run start
```

Der Backend startet auf `http://localhost:3000` (oder der konfigurierten Port).

### Frontend

Das Frontend ist eine statische HTML-Anwendung mit TypeScript. Es kann auf zwei Wegen genutzt werden:

**Option 1: Schnell (nur HTML öffnen)**

1. Öffne `frontend/index.html` mit einem Live Server (z.B. VS Code Live Server Extension)
2. Das Frontend lädt das vorkompilierte `dist/index.js`

> ℹ️ Diese Option funktioniert, wenn `dist/index.js` bereits aktuell ist.

**Option 2: Mit Änderungen (TypeScript recompilieren)**

```bash
cd frontend
npm install
npm run build    # Kompiliert TypeScript zu dist/index.js
npm run watch    # Optional: Watch-Mode für Entwicklung
```

Danach öffne `frontend/index.html` im Live Server (z.B. Port 5500 oder 5501).

## Environment Variables

Erstelle die folgenden `.env`-Dateien basierend auf den `.env.template`-Vorlagen:

### Backend (`backend/.env`)

```env
PORT=3000
BASE_URL=AuthTestApp

# Database
DATABASE_URL=postgresql://user:password@host/database

# JWT Secrets (verwende sichere, zufällige Strings)
JWT_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
```

**Wichtig:**

- `JWT_SECRET` wird für Access Tokens verwendet (Lebensdauer: 15 Minuten)
- `JWT_REFRESH_SECRET` wird für Refresh Tokens verwendet (Lebensdauer: 7 Tage)
- Verwende unterschiedliche Secrets für beide Token-Typen

## API-Endpoints

Alle Requests sollten `Content-Type: application/json` haben.

### Public Endpoints

#### 1. **Register** - Neuen Benutzer erstellen

```http
POST /AuthTestApp/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response (201):**

```json
{
  "status": 201,
  "message": "user created successfully",
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "USER",
      "createdAt": "2026-05-06T10:00:00Z",
      "updatedAt": "2026-05-06T10:00:00Z"
    }
  ]
}
```

#### 2. **Login** - Benutzer anmelden

```http
POST /AuthTestApp/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "status": 200,
  "message": "login successful",
  "data": [
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  ]
}
```

#### 3. **Refresh** - Access Token erneuern

```http
POST /AuthTestApp/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**

```json
{
  "status": 200,
  "message": "token refreshed",
  "data": [
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  ]
}
```

#### 4. **Logout** - Benutzer abmelden

```http
POST /AuthTestApp/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**

```json
{
  "status": 200,
  "message": "logged out successfully",
  "data": []
}
```

### Protected Endpoints (Authentifizierung erforderlich)

#### 5. **Me** - Aktuellen Benutzer abrufen

```http
GET /AuthTestApp/me
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "status": 200,
  "message": "authorized",
  "data": [
    {
      "sub": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "USER"
    }
  ]
}
```

#### 6. **Admin** - Admin-Info abrufen (nur Admins)

```http
GET /AuthTestApp/admin
Authorization: Bearer {accessToken}
```

**Response (200 für Admin):**

```json
{
  "status": 200,
  "message": "admin access granted",
  "data": [
    {
      "sub": "uuid",
      "email": "admin@example.com",
      "username": "admin_user",
      "role": "ADMIN"
    }
  ]
}
```

**Response (403 für normaler User):**

```json
{
  "status": 403,
  "message": "forbidden",
  "data": []
}
```

#### 7. **Make Admin** - Benutzer zu Admin promoten (nur Admins)

```http
PATCH /AuthTestApp/make-admin
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "status": 200,
  "message": "user promoted to admin",
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "ADMIN",
      "createdAt": "2026-05-06T10:00:00Z",
      "updatedAt": "2026-05-06T10:00:00Z"
    }
  ]
}
```

## Datenmodell

### User

- `id`: Eindeutige Identität (CUID)
- `email`: E-Mail (unique)
- `username`: Benutzername (unique)
- `password`: Bcrypt-gehashed Passwort
- `role`: USER oder ADMIN (Standard: USER)
- `refreshTokens`: Liste der Refresh Tokens
- `createdAt`, `updatedAt`: Timestamps

### RefreshToken

- `id`: Eindeutige Identität (CUID)
- `hashedToken`: SHA256-gehashed Token
- `userId`: Referenz zum User
- `expiresAt`: Ablaufzeit (7 Tage nach Erstellung)
- `revoked`: Markiert widerrufen Tokens (für Logout)
- `createdAt`: Erstellungszeitstempel

## Sicherheitsfeatures

1. **Password Hashing:** Bcrypt mit Salt (10 Runden)
2. **JWT-Tokens:** Signiert mit Secrets, kurze Lebensdauer
3. **Token-Rotation:** Refresh Token generiert neues Access + Refresh Token Paar
4. **Token-Revocation:** Logout setzt `revoked=true` für Refresh Tokens
5. **RBAC:** Role-basierte Zugriffskontrolle für Admin-Endpoints
6. **CORS:** Konfigurierbar für spezifische Ursprünge
7. **Input-Validierung:** Normalisierung von E-Mail und Strings

## Testing

Nutze die interaktive Test-UI im Frontend:

1. Öffne `frontend/index.html` im Browser
2. Gebe die Base URL ein (`http://localhost:3000/AuthTestApp`)
3. Teste alle Endpoints direkt in der UI
4. Token werden automatisch angezeigt und können wiederverwendet werden

## Screenshots

### Login

![Login](./screenshots/login.png)

### Dashboard / Token Management

![Dashboard](./screenshots/dashboard.png)

### Refresh Token

![Refresh](./screenshots/refresh.png)

### Logout

![Logout](./screenshots/logout.png)

### Fehlerbehandlung - Falsche Credentials

![Wrong Credentials](./screenshots/wrongCredentials.png)
