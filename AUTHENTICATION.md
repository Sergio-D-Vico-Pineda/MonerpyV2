# MonerpyV2 Authentication System

A 100% dependency-free, session-and-cookie based authentication system for Astro 4.x.

## Features

- **No external dependencies** - Uses only Astro, Vite, and standard Web APIs
- **Session-based authentication** with configurable duration (24h or 30 days)
- **Secure cookies** with HttpOnly, SameSite=Lax, and Secure in production
- **In-memory session storage** with optional file persistence
- **Opt-in page protection** via middleware
- **TypeScript support** with proper type definitions

## Architecture

### Session Storage
- **In-memory**: Global `Map<string, Session>` for fast access
- **Persistence**: JSON file (`sessions.json`) for persistence across server restarts
- **Cleanup**: Automatic removal of expired sessions

### Session Model
```typescript
interface Session {
  userId: number;
  username: string;
  email: string;
  created: string; // unix timestamp
}
```

### Session Duration
- **Short**: 24 hours (86400 seconds)
- **Long**: 30 days (2592000 seconds) - when "remember me" is checked

### Cookie Configuration
- **Name**: `astro-auth`
- **Attributes**: HttpOnly, SameSite=Lax, Secure (in production)
- **Max-Age**: Matches session duration

## API Endpoints

### Login
```typescript
POST /actions/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "remember": true  // optional, defaults to false
}

Response:
{
  "ok": true
}
// or
{
  "ok": false,
  "error": "Invalid email or password"
}
```

### Create Account
```typescript
POST /actions/create
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "John Doe",
}

Response:
{
  "ok": true
}
// or
{
  "ok": false,
  "error": "User with this email already exists"
}
```

### Logout
```typescript
POST /actions/logout
Content-Type: application/json

{}

Response:
{
  "ok": true
}
```

## Page Protection

### Automatic Protection
Pages under these paths are automatically protected:
- `/dashboard/*`

### Manual Opt-in
To protect other pages, you can check for authentication in the page frontmatter:

```astro
---
// In your .astro page
const user = Astro.locals.user;

if (!user) {
  return Astro.redirect('/login?redirectTo=' + Astro.url.pathname);
}
---
```

### User Access
In protected pages, user information is available via:

```astro
---
const user = Astro.locals.user;
// user: { id: number, email: string, created: string } | undefined
---

{user && (
  <p>Welcome, {user.email}!</p>
)}
```

## Files Structure

```
src/
├── lib/
│   └── session-manager.ts       # Session storage and management
├── middleware/
│   └── index.ts                 # Authentication middleware
├── actions/
│   └── accounts/
│       ├── login.ts            # Login action
│       ├── create.ts           # Account creation action
│       └── logout.ts           # Logout action
├── types/
│   └── types.ts                # TypeScript definitions
└── pages/
    ├── login.astro             # Login page
    └── dashboard/
        └── *.astro             # Protected pages
```

## Security Features

1. **HttpOnly Cookies**: Prevents XSS attacks
2. **SameSite=Lax**: Prevents CSRF attacks
3. **Secure Flag**: HTTPS-only in production
4. **Session Expiration**: Automatic cleanup of expired sessions
5. **Server-side Validation**: All session validation happens server-side

## Usage Examples

### Frontend Login Form
```javascript
// Login form submission
const response = await fetch('/actions/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    remember: true
  })
});

const data = await response.json();
if (data.ok) {
  navigate('/dashboard');
}
```

### Frontend Logout
```javascript
// Logout
const response = await fetch('/actions/logout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});

const data = await response.json();
if (data.ok) {
  navigate('/login');
}
```

## Configuration

### Environment Variables
The system automatically detects production mode via `import.meta.env.PROD` to enable secure cookies.

### Database
Uses your existing Prisma setup with the `User` model:
- `id`: Primary key
- `email`: Unique identifier
- `passwordHash`: Plain text (for now, hash later)
- `username`: Display name
- `familyId`: Family association

## Session Persistence

Sessions are automatically:
1. **Saved** to `sessions.json` when created
2. **Loaded** from `sessions.json` on server start
3. **Cleaned** of expired sessions on save/load operations

To disable file persistence, simply remove the `saveSessionsToFile()` and `loadSessionsFromFile()` calls from `session-manager.ts`.

## Development Notes

- **Plain text passwords**: Currently using plain text for simplicity. Hash them before production.
- **Error handling**: All actions return structured error responses
- **TypeScript**: Full type safety with proper `App.Locals` extension
- **No external deps**: Zero dependencies beyond Astro core

## Next Steps

1. **Password hashing**: Replace plain text with proper hashing (bcrypt, scrypt, etc.)
2. **Rate limiting**: Add login attempt limitations
3. **Email verification**: Add email confirmation for new accounts
4. **Password reset**: Implement password reset functionality
5. **Session management**: Add ability to view/revoke active sessions
