# Interactive MERN Authentication Project Guide

Welcome! This guide teaches the project from the first setup step through the finished authentication application. Use the contents links to jump between topics, expand the `<details>` sections for deeper explanations, and work through the checklists in order.

> **Learning objective:** understand how a React browser app talks to an Express API, how MongoDB stores account data, how verification and password-reset emails fit into the flow, and how the app protects a login session.

## Contents

- [How to use this guide](#how-to-use-this-guide)
- [What the finished project does](#what-the-finished-project-does)
- [Technology map](#technology-map)
- [Build it step by step](#build-it-step-by-step)
- [Architecture and request lifecycle](#architecture-and-request-lifecycle)
- [Backend code reference](#backend-code-reference)
- [Frontend code reference](#frontend-code-reference)
- [API walkthrough](#api-walkthrough)
- [Environment and running the project](#environment-and-running-the-project)
- [Security concepts and production notes](#security-concepts-and-production-notes)
- [Practice tasks and self-check](#practice-tasks-and-self-check)
- [Project file map](#project-file-map)

## How to use this guide

1. Follow the build sequence from the top if this is your first pass.
2. Expand the code-reference sections as you reach each file.
3. Keep the application running in two terminals so you can observe both browser and server behavior.
4. Use Swagger to send test requests and compare them with the frontend's requests.
5. Mark the checkboxes as you finish each lesson. They are a personal checklist; save your edited copy if you want to keep progress.

### A few terms before starting

| Term | Meaning in this project |
|---|---|
| **MERN** | MongoDB, Express, React, and Node.js. Mongoose is the project's MongoDB object-document mapper (ODM). |
| **API** | The backend's HTTP endpoints, such as `POST /api/auth/login`. |
| **Middleware** | Express functions that run between receiving a request and sending a response. |
| **Controller** | A function that performs an endpoint's application work, such as checking a password. |
| **Document** | One MongoDB record. Here, a document represents a user. |
| **JWT** | A signed token the API puts in an HTTP-only cookie to identify a session. |
| **State** | Data React uses to decide what to display. Zustand holds shared authentication state; `useState` holds page-local form state. |

## What the finished project does

The app lets a visitor:

- Create an account and receive a six-digit email-verification code.
- Verify the email and start an authenticated session.
- Log in and out.
- Reload the app while preserving a valid session.
- Request a password-reset link, then set a new password with the emailed token.
- View profile and account activity on a protected dashboard.

The React client is a separate Vite app in `frontend/`. The Node/Express server lives in `backend/`, stores users in MongoDB, and sends email through Mailtrap. They communicate using JSON over HTTP; the browser sends the session cookie with Axios requests.

## Technology map

Dependencies below are based on the root and frontend package manifests.

| Technology | Where it is used | What it contributes |
|---|---|---|
| Node.js + ES modules | Backend | JavaScript runtime; `"type": "module"` enables `import`/`export`. |
| Express 5 | Backend | HTTP server, route registration, middleware, and JSON responses. |
| MongoDB + Mongoose | Backend | Persistent user records, schema, queries, indexes, and timestamps. |
| React 19 + React DOM | Frontend | Component-based UI and rendering into the browser DOM. |
| Vite | Frontend | Development server, hot reload, and production bundling. |
| React Router | Frontend | URL routes, navigation, URL parameters, and route guards. |
| Zustand | Frontend | Shared authentication state and API action functions. |
| Axios | Frontend | HTTP requests; `withCredentials` sends cookies. |
| bcryptjs | Backend | Password hashing and password comparison. |
| jsonwebtoken | Backend | Signing and verifying session JWTs. |
| Node `crypto` | Backend | Secure random verification/reset tokens and SHA-256 token hashing. |
| Mailtrap SDK | Backend | Sending verification, welcome, and password recovery email. |
| express-validator | Backend | Request body/path validation before controllers run. |
| express-rate-limit | Backend | Limits repeated requests to authentication endpoints. |
| Helmet + CORS + cookie-parser | Backend | Security headers, browser origin policy, and cookie parsing. |
| swagger-ui-express + OpenAPI | Backend | Serves interactive API docs and the static OpenAPI specification. |
| Tailwind CSS 4 | Frontend | Utility-first styling, loaded through Vite's Tailwind plugin. |
| Framer Motion | Frontend | Animation of page panels, backgrounds, and buttons. |
| Lucide React | Frontend | Icons for inputs, indicators, and buttons. |
| React Hot Toast | Frontend | Short success/error notifications. |
| ESLint | Frontend | Checks JS/JSX code and React hook patterns. |
| Nodemon | Backend development | Restarts the backend when source files change. |

**Important distinction:** the registration password policy enforced by the API is at least six characters and no more than 72 UTF-8 bytes. The browser's strength meter additionally suggests uppercase, lowercase, number, and special characters, but those extra suggestions are not server requirements.

## Build it step by step

This sequence is a learning path for recreating the app. It follows the dependencies between features rather than just the order of files.

### Step 1 — Define the user journey

Write down the states before building screens:

1. Visitor has no account.
2. Visitor submits signup information.
3. Account exists but is not verified.
4. User verifies the email and becomes signed in.
5. Signed-in user can load the dashboard.
6. User can log in again later using the session cookie.
7. User can request a password reset if they forget the password.

This prevents a common beginner mistake: building a form without first deciding which state change each form should cause.

**Checkpoint:** can you explain why signup does not immediately create a verified session?

### Step 2 — Create the repository and separate client/server

Keep the API and UI in separate directories:

```text
project/
  backend/
  frontend/
```

The root `package.json` starts the API. `frontend/package.json` starts and builds the React app. Separate manifests make each side's dependencies and scripts clear.

**Checkpoint:** which package manifest contains the `dev` script for Vite, and which one starts Nodemon?

### Step 3 — Design the user document

Start with the fields the workflows need: email, password hash, display name, verification status, login date, and temporary verification/reset tokens with expirations. Put these in the Mongoose model before writing controllers, so the data layer has a clear contract.

In this project, `user.model.js` also:

- makes email unique and lowercase;
- enables `createdAt`/`updatedAt` timestamps;
- indexes temporary token fields;
- removes password hashes and temporary/internal token fields when a user becomes JSON.

**Checkpoint:** why should the API store a password hash rather than the submitted password?

### Step 4 — Connect MongoDB and configure environment values

Put secrets and deployment-specific values in `.env`, load them before modules access `process.env`, and connect through `mongoose.connect`. Fail at startup if required connection or JWT configuration is invalid rather than letting an insecure/half-started server appear healthy.

**Checkpoint:** can you point to the source of `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`?

### Step 5 — Start the Express server

Create the Express app, then install middleware in an intentional order:

1. Helmet sets response security headers.
2. CORS permits the configured frontend origin and credentials.
3. `express.json()` parses JSON request bodies.
4. `cookieParser()` makes cookies available in `req.cookies`.
5. Documentation and application routes are mounted.
6. The database connection completes before the server starts listening.

**Checkpoint:** what needs to run before a controller can read `req.body` or `req.cookies`?

### Step 6 — Add one route and one controller at a time

Begin with signup: validate its JSON, hash the password, create the user document, save it, and return a sanitized response. Keep route wiring in `auth.route.js` and business logic in `auth.controllers.js`.

Then add login and shared session creation. The route should be thin; validation, rate limiting, authentication middleware, and controllers should each have one responsibility.

**Checkpoint:** trace `POST /api/auth/signup` from route registration to the `User` database write.

### Step 7 — Add email verification

Generate a cryptographically random six-digit code, save it with a short expiration, and email it. The verification route checks both the normalized email and code, checks expiration, marks the user verified, clears the temporary code, and sets the session cookie.

**Checkpoint:** what prevents a stale verification code from being reused?

### Step 8 — Add password recovery

The forgot-password action creates a long random token. Store only its SHA-256 digest in MongoDB; send the original token in the reset link. The reset route hashes the supplied token, finds the matching unexpired record, hashes the new password, clears the reset token, and increments the session version to invalidate old sessions.

**Checkpoint:** why does the database store a hash of the reset token but the email needs the original token?

### Step 9 — Build reusable React forms and pages

Make shared UI pieces (`Input`, loading indicator, floating decoration, password meter), then build pages around local form state. Each page calls a Zustand action rather than duplicating Axios request details.

**Checkpoint:** which values belong in a single form component's local state, and which are shared by multiple pages?

### Step 10 — Add routing, session restoration, and guards

Use React Router to map URLs to pages. On initial render, call `checkAuth()` once to ask the backend whether the cookie still represents a valid session. While that check is running, show a spinner; once complete, render the route tree and redirect users based on authentication state.

**Checkpoint:** why does a route guard alone not replace the backend's `verifyToken` middleware?

### Step 11 — Document, test, and harden

Use Swagger UI to exercise the API independently of React. Check the frontend lint/build scripts, then exercise the complete signup → verify → logout/login → reset flow. Verify browser cookies and server logs; never put real credentials into source control.

**Checkpoint:** can you test the API with Swagger without relying on the UI?

### Step 12 — Deploy with production settings

Use a production MongoDB URI, strong random JWT secret, configured Mailtrap sender, exact frontend URL, HTTPS, and a shared rate-limit store if running multiple backend instances. The cookie is `Secure` only when `NODE_ENV=production` and has `SameSite=Strict`, so plan frontend/API hosting on the same site.

**Checkpoint:** list the values that must differ between your local machine and production.

## Architecture and request lifecycle

### How a normal API call travels

```text
React page
  -> Zustand action
    -> Axios request (JSON and, where needed, cookie)
      -> Express middleware (CORS, JSON parsing, cookies)
        -> route middleware (rate limit, validation, authentication)
          -> controller
            -> Mongoose model/query
            -> Mailtrap, if needed
          <- JSON response and/or Set-Cookie
    <- Zustand updates shared state
  <- React rerenders the page or navigates
```

### Sign up and verify

```text
SignUpPage
  -> authStore.signup(email, password, name)
  -> POST /api/auth/signup
  -> signupLimiter -> signupValidation -> handleValidationErrors -> signup
  -> normalize email -> bcrypt hash -> User.save()
  -> generate six-digit code -> send verification email
  -> sanitized user response (account is not authenticated yet)
  -> navigate to /verify-email
  -> authStore.verifyEmail(email, code)
  -> POST /api/auth/verify-email
  -> verify code + expiry -> set isVerified -> clear code
  -> set HTTP-only JWT cookie -> authenticated response
  -> navigate to dashboard
```

### Login and restore a session

```text
LoginPage -> authStore.login -> POST /api/auth/login
  -> validate -> find normalized email -> bcrypt.compare
  -> require verified account -> update lastLogin
  -> sign JWT -> Set-Cookie: token=...; HttpOnly; SameSite=Strict
  -> Zustand stores user and isAuthenticated=true

Browser reload -> App useEffect -> authStore.checkAuth
  -> GET /api/auth/check-auth (Axios includes cookie)
  -> verifyToken checks JWT, database user, verified state, tokenVersion
  -> checkAuth controller returns user
  -> Zustand restores session; guards choose the route
```

### Password reset

```text
ForgotPasswordPage -> POST /api/auth/forgot-password
  -> if account exists: generate random token, hash for storage, save expiry
  -> email reset URL containing the original token
  -> always return a generic success message

ResetPasswordPage -> POST /api/auth/reset-password/:token
  -> hash URL token -> match unexpired stored hash
  -> hash new password -> clear reset fields
  -> increment tokenVersion -> save -> send confirmation email
```

## Backend code reference

### Server, configuration, and database

<details>
<summary><code>backend/index.js</code> — application composition</summary>

- `express()` creates the Express application object, `app`.
- `PORT` reads `process.env.PORT` or falls back to `5000`.
- The startup guard checks that `JWT_SECRET` exists, is at least 32 characters, and is not the example placeholder. Throwing before startup avoids signing sessions with an unsafe default.
- `helmet()` adds security headers. The docs mount applies additional, Swagger-specific Helmet directives; the global security middleware still runs for documentation and API requests.
- `cors({ origin, credentials: true })` allows the configured client origin to make credentialed cross-origin requests. Browsers cannot use wildcard `*` with credentials.
- `express.json()` fills `req.body` for JSON requests.
- `cookieParser()` parses the incoming cookie header into `req.cookies`.
- `GET /api-docs.json` returns the OpenAPI specification object.
- `/api-docs` mounts Swagger UI.
- `/api/auth/` mounts the auth router.
- `await connectDB()` runs before `app.listen(...)`, so the API does not accept requests before its database connection is ready.
- `app.listen(PORT, callback)` starts accepting HTTP requests and logs the port.

</details>

<details>
<summary><code>backend/config/env.js</code> and <code>backend/db/connectDB.js</code> — environment and MongoDB</summary>

**`env.js`**

- `dotenv.config({ quiet: true })` reads `.env` into `process.env` before the server imports code that reads configuration.

**`connectDB.js`**

- `connectDB()` is an async startup function. It calls `mongoose.connect(process.env.MONGODB_URI)`, then logs the connection host.
- `await` waits for MongoDB to connect.
- `try/catch` reports a connection failure and calls `process.exit(1)` so the process exits with a failure status instead of running without persistence.

</details>

### User model

<details>
<summary><code>backend/models/user.model.js</code> — schema, indexes, and JSON sanitization</summary>

`new mongoose.Schema(fields, options)` defines the structure and behavior for MongoDB user documents:

| Field | Purpose |
|---|---|
| `email` | Required, unique, trimmed, lowercased, max 254 characters. |
| `password` | Required bcrypt hash; never return it to the client. |
| `name` | Required display name, trimmed, max 100 characters. |
| `lastLogin` | Date, initialized to the current time. Updated on successful login. |
| `isVerified` | Whether the email has been verified; defaults to `false`. |
| `tokenVersion` | Integer-like session version used to revoke older JWTs. |
| `verificationToken`, `verificationTokenExpiredAt` | Temporary code and expiry for account verification. |
| `resetPasswordToken`, `resetPasswordExpiredAt` | SHA-256 digest and expiry for password reset. |
| `createdAt`, `updatedAt` | Automatically added by `{ timestamps: true }`. |

- `userSchema.index({ verificationToken: 1 }, { sparse: true })` and the reset-token index help look up temporary tokens while skipping documents that do not have those optional fields.
- `userSchema.set("toJSON", { transform })` registers a transform that removes `password`, verification/reset token data, `tokenVersion`, and Mongoose's `__v` from serialized user objects.
- `mongoose.model("User", userSchema)` creates and exports the `User` model used for queries and writes.

</details>

### Authentication routes and middleware

<details>
<summary><code>backend/routes/auth.route.js</code> — endpoint and middleware order</summary>

`express.Router()` creates a router that is mounted under `/api/auth/`. The route path is appended to that prefix. For example, `router.post("/signup", ...)` becomes `POST /api/auth/signup`.

| Route | Middleware sequence | Controller |
|---|---|---|
| `GET /check-auth` | `verifyToken` | `checkAuth` |
| `POST /signup` | `signupLimiter`, `signupValidation`, `handleValidationErrors` | `signup` |
| `POST /login` | `loginLimiter`, `loginValidation`, `handleValidationErrors` | `login` |
| `POST /logout` | `authLimiter`, `verifyToken` | `logout` |
| `POST /verify-email` | `verifyEmailLimiter`, `verifyEmailValidation`, `handleValidationErrors` | `verifyEmail` |
| `POST /resend-verification` | `forgotPasswordLimiter`, `resendVerificationValidation`, `handleValidationErrors` | `resendVerificationEmail` |
| `POST /forgot-password` | `forgotPasswordLimiter`, `forgotPasswordValidation`, `handleValidationErrors` | `forgotPassword` |
| `POST /reset-password/:token` | `authLimiter`, `resetPasswordValidation`, `handleValidationErrors` | `resetPassword` |

Express passes the request through middleware in the listed order. A middleware can end the response early or call `next()` to continue.

</details>

<details>
<summary><code>backend/middleware/validation.js</code> — request validation</summary>

- `body("field")` selects a body field; `param("token")` selects a URL path parameter.
- `.trim()`, `.toLowerCase()`, `.notEmpty()`, `.isEmail()`, `.isLength()`, `.matches()`, and `.isString()` are express-validator chain methods that sanitize/check input.
- `.withMessage(...)` sets the client-facing validation message.
- `.bail()` stops the chain for that field after a failed validation.
- `.custom(callback)` adds the project's custom 72-byte UTF-8 password limit using `Buffer.byteLength`.
- `passwordValidation()` returns a reusable validator chain: password must be a string, at least six characters, and at most 72 UTF-8 bytes.
- `signupValidation`, `loginValidation`, `verifyEmailValidation`, `resendVerificationValidation`, `forgotPasswordValidation`, and `resetPasswordValidation` are arrays of middleware specific to each request shape.
- `validationResult(req)` collects errors from earlier validation middleware.
- `handleValidationErrors(req, res, next)` returns the first error as `{ success: false, message }` with status 400; if there are no errors, `next()` hands off to the next middleware/controller.

The email-normalization validator mutates the field to trimmed lowercase data before a controller receives it. Controllers also normalize email before querying, making their behavior explicit.

</details>

<details>
<summary><code>backend/middleware/rateLimiter.js</code> — per-IP request limits</summary>

- `rateLimit(options)` creates Express middleware that limits requests by IP using the library's default in-memory store.
- `jsonMessage(message)` builds the JSON error shape used when a limit is exceeded.
- `authLimiter`: 100 requests per 15 minutes; used for logout and reset password.
- `loginLimiter`: 10 login attempts per 15 minutes.
- `signupLimiter`: 5 signup attempts per hour.
- `verifyEmailLimiter`: 5 verification attempts per 15 minutes.
- `forgotPasswordLimiter`: 5 requests per hour; shared by forgot-password and resend-verification.
- `windowMs` is the counting window, `limit` is the maximum, `standardHeaders` enables standardized rate-limit headers, and `legacyHeaders: false` disables older headers.

The in-memory counter is per server process. A production deployment with multiple server instances should use a shared store and configure proxy trust appropriately.

</details>

<details>
<summary><code>backend/middleware/verifyToken.js</code> — protected-route authentication</summary>

`verifyToken(req, res, next)` performs these checks:

1. Reads `req.cookies.token`; returns 401 when absent.
2. Calls `jwt.verify(token, process.env.JWT_SECRET)`. Invalid or expired JWTs throw and are returned as 401.
3. Loads the user and selects only `isVerified` and `tokenVersion`.
4. Rejects a missing/unverified user or a token whose `tokenVersion` differs from the current database value.
5. Stores the user's ID in `req.userId`, then calls `next()`.

The JWT signature proves the token was created with the server secret and was not changed; the database checks also allow the server to revoke sessions after logout/password reset.

</details>

### Controllers and shared helpers

<details>
<summary><code>backend/controllers/auth.controllers.js</code> — each controller's job</summary>

All controllers receive the Express `req` (incoming request) and `res` (response) objects. They use `res.status(code).json(data)` to send an HTTP status and JSON body.

#### `signup(req, res)`

1. Reads `email`, `password`, and `name` from `req.body`; trims/lowercases the email.
2. Finds an existing user. A duplicate receives a generic message, avoiding an account-existence disclosure.
3. Hashes the password with `bcryptjs.hash(password, 10)`; `10` is the bcrypt work factor.
4. Calls `generateVerificationToken()`, creates a `User` with a 15-minute verification expiry, and calls `user.save()`.
5. Calls `sendVerificationEmail`. Email failure is logged without undoing account creation.
6. Returns status 201 and a serialized user, sanitized by the model's `toJSON` transform.
7. Handles MongoDB duplicate-key error code `11000` as the same generic 400 response (covers simultaneous signup race conditions); other failures return a generic 500.

#### `resendVerificationEmail(req, res)`

Normalizes the submitted email and searches only for an unverified account. If found, it creates and saves a fresh code with a new 15-minute expiry and emails it. Regardless of whether the account exists, the endpoint responds with the same 200 message. Database failures return 500.

#### `verifyEmail(req, res)`

Finds a user using the normalized email, submitted code, and `verificationTokenExpiredAt: { $gt: Date.now() }`. `$gt` means greater than, so expired codes are excluded. On success it sets `isVerified`, clears the temporary token/expiry, saves, calls `generateTokenAndSetCookie`, and sends a welcome email. The sanitized user response is returned with status 200. Invalid/expired codes return 400.

#### `login(req, res)`

Normalizes email, finds the user, and calls `bcryptjs.compare(password, hash)`. If no user is found, it compares against `DUMMY_PASSWORD_HASH` instead; this makes unknown-email and wrong-password paths more similar in timing. It returns a generic 400 for invalid credentials, returns 403 for an unverified account, otherwise updates `lastLogin`, saves, sets the JWT cookie, and returns the user.

`DUMMY_PASSWORD_HASH` is created once with `bcryptjs.hashSync("dummy-password", 10)` and is only used for the timing comparison; it is not a user's credential.

#### `logout(req, res)`

`verifyToken` has already set `req.userId`. `User.findByIdAndUpdate(req.userId, { $inc: { tokenVersion: 1 } })` increments the stored session version, invalidating JWTs signed with the previous version. `res.clearCookie("token", options)` removes the browser cookie using matching security attributes.

#### `forgotPassword(req, res)`

Looks up the normalized email. If a user exists, `crypto.randomBytes(20).toString("hex")` creates the plaintext reset token; `crypto.createHash("sha256").update(token).digest("hex")` creates the database-safe digest. It saves the digest and a one-hour expiry, then emails a reset URL containing the plaintext token. It sends a generic 200 response either way to avoid account enumeration.

#### `resetPassword(req, res)`

Reads `token` from `req.params` and `password` from `req.body`. It hashes the incoming token and searches for a matching, unexpired digest. If found, it hashes the new password, increments `tokenVersion`, clears reset fields, saves, and sends a password-reset confirmation. Invalid or expired tokens return 400.

#### `checkAuth(req, res)`

Uses `req.userId` set by `verifyToken` to find the current user, explicitly excludes password with `.select("-password")`, and returns the user. A missing user returns 400.

</details>

<details>
<summary><code>backend/utils/generateVerificationToken.js</code> and <code>generateTokenAndSetCookie.js</code></summary>

**`generateVerificationToken()`**

- Calls `crypto.randomInt(100000, 1000000)`. The upper bound is exclusive, so the result is 100000 through 999999.
- Converts the integer to a string, preserving the code as text for email and input handling.
- Uses cryptographically secure randomness instead of `Math.random()`.

**`generateTokenAndSetCookie(res, userId, tokenVersion = 0)`**

- `jwt.sign({ userId, tokenVersion }, JWT_SECRET, { expiresIn: "7d" })` produces a signed token that expires in seven days.
- `res.cookie("token", token, options)` sets it as HTTP-only, SameSite Strict, and Secure in production, with a matching seven-day browser max age.
- Returns the JWT, though controllers use the cookie as the browser-facing session mechanism.

</details>

### Email delivery and Swagger

<details>
<summary><code>backend/email/</code> — SMTP transport, send functions, and templates</summary>

**`email.config.js`**

- `nodemailer.createTransport(...)` configures one SMTP connection using `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_SECURE`.
- `sender` uses the address in `EMAIL_DOMAIN` and a display name.

**`emails.js`**

- `sendVerificationEmail(email, verificationToken)` inserts the code into `VERIFICATION_EMAIL_TEMPLATE` and sends it through SMTP.
- `sendWelcomeEmail(email, name)` renders the local welcome template and escapes the recipient's name before inserting it.
- `sendPasswordResetEmail(email, resetURL)` inserts the reset link into the reset-request template and sends it.
- `sendResetSuccessEmail(email)` sends the password-change confirmation template.
- All four functions use `transporter.sendMail(...)`; send failures are logged and rethrown. Controllers catch these errors so the intended API response can still be returned.

**`emailTemplates.js`**

- `WELCOME_EMAIL_TEMPLATE`, `VERIFICATION_EMAIL_TEMPLATE`, `PASSWORD_RESET_REQUEST_TEMPLATE`, and `PASSWORD_RESET_SUCCESS_TEMPLATE` are exported HTML strings.
- `.replace("{verificationCode}", code)` and `.replace("{resetURL}", url)` substitute dynamic content before sending.

</details>

<details>
<summary><code>backend/config/swagger.js</code> — OpenAPI object and helpers</summary>

- `swaggerSpecification` is a plain JavaScript object following OpenAPI 3.0.3. It describes the API metadata, local server URL, eight paths, request schemas, responses, and the cookie security scheme.
- `errorResponse`, `validationErrorResponse`, and `rateLimitResponse` are reusable response-description objects.
- `jsonRequest(schema)` builds an `application/json` request body referencing a named component schema.
- `jsonResponse(description, schema, example)` builds a JSON response and adds an example only when provided.
- `messageExample(success, message)` creates examples matching the API's `{ success, message }` response shape.
- `$ref` values such as `#/components/schemas/User` link to reusable schema definitions elsewhere in the specification.
- `swagger-ui-express` serves the UI; `/api-docs.json` exposes the raw specification.

</details>

## Frontend code reference

### Entry point and route guards

<details>
<summary><code>frontend/src/main.jsx</code> and <code>App.jsx</code></summary>

**`main.jsx`**

- `document.getElementById("root")` finds the root element from `index.html`.
- `createRoot(...).render(...)` mounts the React tree.
- `<StrictMode>` enables extra development checks.
- `<BrowserRouter>` enables browser-history-based routes and navigation.
- The CSS import loads Tailwind's entry stylesheet.

**`App.jsx`**

- `ProtectRoute({ children })` reads `isAuthenticated` and `user` from Zustand. It redirects unauthenticated users to `/login`, unverified users to `/verify-email`, and otherwise renders the child page.
- `RedirectAuthenticatedUser({ children })` sends already authenticated/verified users to `/`; otherwise it renders the login/signup/recovery page.
- `App()` selects `isCheckingAuth` and `checkAuth` from the store. Its `useEffect(() => checkAuth(), [checkAuth])` restores a session on app load.
- While authentication is being checked, it returns `<LoadingSpinner />`.
- `<Routes>` and `<Route>` map URLs to pages. `:token` in `/reset-password/:token` is a dynamic route segment.
- `<Navigate to="..." replace />` redirects and replaces the current browser history entry.
- `FloatingShape` components decorate the page; `<Toaster />` provides toast notification output.

Routes: `/` dashboard (protected), `/signup`, `/login`, `/forgot-password`, and `/reset-password/:token` (redirect signed-in users away), plus `/verify-email`. Unknown paths redirect to `/`.

</details>

### Shared authentication state and API calls

<details>
<summary><code>frontend/src/store/authStore.jsx</code> — Zustand state and actions</summary>

`create((set) => storeObject)` creates the global store. Components call `useAuthStore()` to read values or actions. `set({...})` updates selected fields and triggers subscribed components to rerender.

#### State fields

| Field | Meaning |
|---|---|
| `user` | Current public user object, or `null`. |
| `isAuthenticated` | Whether the client considers the session active. The server still validates protected requests. |
| `error` | Most recent action error message. |
| `isLoading` | Loading state for form actions. |
| `isCheckingAuth` | Initial session-restoration state. |
| `message` | Generic success/status message from recovery actions. |
| `signupEmail` | Email remembered after signup to prefill verification. |

`API_URL` uses `VITE_API_URL` or defaults to `http://localhost:5000/api/auth`. `axios.defaults.withCredentials = true` tells Axios/browser to include cookies in cross-origin requests and accept cookie responses where CORS permits them.

#### Actions

- `signup(email, password, name)`: sets loading, posts to `/signup`, stores the returned user and email, but leaves `isAuthenticated` false until verification. On failure it stores the API message and rethrows.
- `login(email, password)`: posts to `/login`, stores the user, and sets authenticated state. On failure it stores the API message and rethrows.
- `logout()`: posts to `/logout`; on success clears user/authenticated state. On failure it records an error and rethrows.
- `verifyEmail(email, code)`: posts the code, stores the returned user, sets authenticated, and returns the response data.
- `resendVerification(email)`: posts to `/resend-verification`, stores the generic server message, and returns the response data.
- `checkAuth()`: marks initial auth check active and requests `/check-auth`. On success, stores user and authenticated state. If the check fails (for example no cookie), it clears the loading/check state and leaves the user unauthenticated.
- `forgotPassword(email)`: posts to `/forgot-password` and stores its generic message.
- `resetPassword(token, password)`: posts to `/reset-password/${token}` and stores the server message.

Each action uses `async/await` because Axios calls return promises. `try/catch` updates the shared UI state; actions used by forms rethrow errors when the page needs to decide how to respond. `error.response?.data?.message` uses optional chaining because a network error may not contain an HTTP response.

</details>

### Page components

<details>
<summary><code>SignUpPage.jsx</code> and <code>LoginPage.jsx</code></summary>

**`SignUpPage`**

- `useState` creates local `name`, `email`, and `password` values; each input's `onChange` setter updates its controlled value.
- `useNavigate()` returns the `navigate` function for programmatic routing.
- `useAuthStore()` selects `signup`, `error`, and `isLoading`.
- `handleSignup(event)` calls `event.preventDefault()` to stop the browser's normal form submission, awaits signup, then navigates to `/verify-email`. On rejection it logs the error; the form displays the store error.
- Reusable `Input` components receive icon components (`User`, `Mail`, `Lock`); `PasswordStrengthMeter` reads the current password.
- The submit button disables during a request and swaps its label for a spinning `Loader`.

**`LoginPage`**

- Local `email` and `password` state powers the controlled inputs.
- `handleLogin(event)` prevents page reload and calls the shared `login` action.
- React Router `<Link>` navigates to password recovery or signup without reloading the document.
- `isLoading` disables the button and shows a spinner; `error` displays the API/store error.

</details>

<details>
<summary><code>EmailVerificationPage.jsx</code></summary>

- `code` is a six-element array of strings—one per digit input.
- `inputRefs` is a React ref array holding the actual input DOM nodes so the page can move keyboard focus.
- `email` begins with `signupEmail` from Zustand but is editable.
- `handleChange(index, value)` copies the current code array. If a pasted value is longer than one character, it takes up to six characters, fills the array, and focuses the next empty or final input. Otherwise it updates one digit and advances focus.
- `handleKeyDown(index, event)` moves focus left on Backspace when the current field is empty.
- `handleSubmit` is wrapped with `useCallback` so `useEffect` can use a stable callback until its listed dependencies change. It joins the digit array, calls `verifyEmail`, navigates to `/`, and shows a toast on success.
- `handleResend()` calls `resendVerification` and displays a generic success toast.
- `useEffect` checks whether all six values are nonempty and automatically submits when complete.
- `.map()` renders one controlled input per digit; `.every()`/`.some()` check completion and disable invalid submission.

</details>

<details>
<summary><code>ForgotPasswordPage.jsx</code> and <code>ResetPasswordPage.jsx</code></summary>

**`ForgotPasswordPage`**

- `email` stores the entered address; `isSubmitted` selects which screen to show.
- `handleSubmit(event)` prevents default form submission, awaits `forgotPassword(email)`, and then switches to the confirmation message.
- It deliberately tells the visitor to check email without revealing whether the account exists.
- `<Link>` returns to login.

**`ResetPasswordPage`**

- `password` and `confirmPassword` are local controlled input values.
- `useParams()` reads the `token` from `/reset-password/:token`.
- `handleSubmit(event)` prevents default submission, compares the two password fields, then calls `resetPassword(token, password)`.
- On success it shows a toast and schedules navigation to login with `setTimeout`.
- `error` and `message` are read from Zustand. `isLoading` disables the submit button.

</details>

<details>
<summary><code>DashboardPage.jsx</code> — protected profile</summary>

- Reads `user` and `logout` from Zustand.
- `handleLogout()` starts the logout action.
- Displays user name, email, `createdAt`, and `lastLogin`.
- `new Date(...).toLocaleDateString(...)` formats the join date; `formatDate(...)` formats the last-login timestamp.
- Framer Motion's `initial`, `animate`, `exit`, and `transition` props animate the dashboard panels.

</details>

### Reusable components, utilities, and styling

<details>
<summary><code>Input.jsx</code>, <code>LoadingSpinner.jsx</code>, <code>FloatingShape.jsx</code>, and <code>PasswordStrengthMeter.jsx</code></summary>

**`Input({ icon: Icon, ...props })`**

- Destructures the `icon` prop and aliases it to `Icon`, which can be rendered as a React component.
- `...props` collects remaining input props (`type`, `value`, `onChange`, placeholder, etc.).
- `<input {...props}>` forwards them to the native input; this makes the component reusable for different fields.
- The icon wrapper uses `pointer-events-none` so it does not block clicking/focusing the input.

**`LoadingSpinner()`**

- Renders a full-page `motion.div` spinner.
- `animate={{ rotate: 360 }}` rotates it; `transition` repeats infinitely with a linear one-second duration.

**`FloatingShape({ color, size, top, left, delay })`**

- Builds Tailwind classes from visual props.
- `style={{ top, left }}` positions the decoration.
- Framer Motion's `animate` cycles vertical/horizontal position and rotation; `delay` staggers each shape.
- `aria-hidden="true"` marks it as decorative for assistive technology.

**`PasswordCriteria({ password })`**

- Builds an array of label/boolean objects for minimum length, uppercase, lowercase, number, and special character checks.
- `.map()` renders a row for each criterion with a check or X icon depending on `item.met`.
- This is a browser-side guide for the user, not the backend's full password policy.

**`PasswordStrengthMeter({ password })`**

- `getStrength(pass)` counts four conditions: length of at least six, both lowercase and uppercase, a number, and a special character. The count is 0–4.
- `getColor(strength)` chooses the displayed color; `getStrengthText(strength)` gives a human-readable label.
- `[...Array(4)].map(...)` renders four strength segments, coloring those below the calculated strength.
- It renders `PasswordCriteria` alongside the meter.

</details>

<details>
<summary><code>utils/date.js</code>, <code>index.css</code>, and Vite entry files</summary>

- `formatDate(dateString)` constructs a JavaScript `Date`, tests `date.getTime()` with `isNaN` to catch invalid dates, and otherwise calls `toLocaleString("en-US", options)` with year, month, day, hour, and minute. It returns `"Invalid Date."` for invalid input.
- `index.css` imports Tailwind with `@import "tailwindcss";`.
- `vite.config.js` calls `defineConfig` and registers `@tailwindcss/vite` as a Vite plugin. That enables Tailwind processing in the frontend.
- `index.html` supplies the browser document, root `<div id="root">`, and module entry script pointing to `/src/main.jsx`.
- `eslint.config.js` combines ESLint's recommended JavaScript rules with browser globals, React Hooks rules, and React Refresh rules; it ignores the production `dist` output.

</details>

## API walkthrough

Base URL locally: `http://localhost:5000`. Every route below is prefixed by `/api/auth`.

| Method and path | Request data | What it does | Session cookie |
|---|---|---|---|
| `POST /signup` | `{ "name", "email", "password" }` | Creates an unverified account and emails a code. | No |
| `POST /verify-email` | `{ "email", "code" }` | Verifies the code and signs in. | Sets cookie |
| `POST /resend-verification` | `{ "email" }` | Resends code where applicable; generic response. | No |
| `POST /login` | `{ "email", "password" }` | Authenticates a verified account. | Sets cookie |
| `POST /logout` | Cookie | Revokes sessions and clears cookie. | Clears cookie |
| `GET /check-auth` | Cookie | Returns current authenticated user. | Requires cookie |
| `POST /forgot-password` | `{ "email" }` | Emails a reset link when account exists; generic response. | No |
| `POST /reset-password/:token` | `{ "password" }` | Resets password using a valid emailed token. | No |

`POST /logout` and `GET /check-auth` require the `token` cookie. In a browser, Axios sends it because `withCredentials` is enabled and the backend allows credentials from the configured origin.

### Try the API with Swagger

1. Start the backend with `npm run dev`.
2. Open [http://localhost:5000/api-docs](http://localhost:5000/api-docs).
3. Expand an operation and select **Try it out**.
4. Submit signup, then verify using the emailed code.
5. Swagger can document the cookie scheme, but browser handling of HTTP-only cookies is controlled by the browser. For authenticated calls, try the frontend or an HTTP client that retains response cookies.
6. View the raw document at [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json).

## Environment and running the project

### Prerequisites

- A supported Node.js version for the installed Vite/Express dependencies.
- npm.
- MongoDB connection string (local or Atlas).
- Mailtrap SMTP host, credentials, and sender email address configured for the account.

### Configure the backend

From the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in `.env`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string and database. |
| `PORT` | Backend port; defaults to `5000`. |
| `JWT_SECRET` | Random signing secret of at least 32 characters. The example placeholder is rejected. |
| `NODE_ENV` | Use `development` locally; use `production` behind HTTPS to enable Secure cookies. |
| `SMTP_HOST` | Mailtrap SMTP host (for example, `sandbox.smtp.mailtrap.io`). |
| `SMTP_PORT` | SMTP port; defaults to `2525`. |
| `SMTP_USER` | Mailtrap SMTP username. |
| `SMTP_PASS` | Mailtrap SMTP password. |
| `SMTP_SECURE` | Set to `true` when the SMTP server requires an implicit TLS connection; otherwise use `false`. |
| `EMAIL_DOMAIN` | Sender email address verified or accepted by Mailtrap. |
| `CLIENT_URL` | Exact frontend origin allowed by CORS and used in reset URLs; local value is `http://localhost:5173`. |

Generate a local JWT secret with Node:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Never paste real tokens or `.env` values into the guide, issue tracker, screenshots, or source control. `.env.example` contains placeholders.

### Install and run

Open two terminals in the repository:

**Terminal 1 — backend, from repository root**

```powershell
npm install
npm run dev
```

**Terminal 2 — frontend**

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the Vite URL shown in the frontend terminal (normally `http://localhost:5173`). The frontend defaults to the API at `http://localhost:5000/api/auth`. To override it, add `VITE_API_URL` to `frontend/.env` (for example `VITE_API_URL=http://localhost:5000/api/auth`) and restart Vite.

### Useful commands

| Directory | Command | Purpose |
|---|---|---|
| repository root | `npm run dev` | Start Express with Nodemon. |
| `frontend/` | `npm run dev` | Start Vite development server. |
| `frontend/` | `npm run lint` | Run ESLint. |
| `frontend/` | `npm run build` | Create production frontend output in `dist/`. |
| `frontend/` | `npm run preview` | Preview the production build locally. |

## Security concepts and production notes

- **Password storage:** bcrypt hashes are saved, not plaintext passwords. Password checks use `bcrypt.compare`.
- **Email verification:** codes are cryptographically random and expire after 15 minutes.
- **Reset tokens:** the plaintext reset token is emailed once; only its SHA-256 hash is stored; it expires after one hour.
- **Cookie session:** JWT is in an HTTP-only, SameSite Strict cookie; JavaScript cannot read it. In production the cookie is Secure and requires HTTPS.
- **Session revocation:** `tokenVersion` in the JWT is compared with the current database value. Logout and password reset increment the database value.
- **Account enumeration:** signup, resend-verification, and forgot-password use generic responses in relevant cases so they reveal less about whether an email is registered.
- **Login timing:** a dummy bcrypt comparison makes missing-user logins perform a similar password-hash operation to wrong-password logins.
- **Rate limiting:** protects login, signup, verification, and recovery operations from repeated attempts. The default limiter store is in-memory, so multi-instance production requires shared storage.
- **CORS:** configure `CLIENT_URL` to the precise origin. CORS is not an authentication mechanism; protected API routes still validate the cookie.
- **Email errors:** controllers log email-send errors and continue responding; account/verification/reset persistence may already have succeeded even if email delivery fails.
- **MongoDB migration:** email addresses are normalized to lowercase. Back up existing data and resolve case-insensitive duplicates before applying this behavior to a populated database.
- **Cookie deployment:** `SameSite=Strict` works best when frontend and API are on the same site (for example, sibling subdomains of one registrable domain).

This guide explains the current code; it is not a substitute for a production security review, monitoring, email-delivery retries, or deployment-specific CSRF and proxy configuration.

## Practice tasks and self-check

### Try these changes after you understand the flow

- [ ] Add a `GET /api/auth/profile` endpoint that uses `verifyToken` and returns only safe profile fields.
- [ ] Add a Mongoose field and display it on the dashboard.
- [ ] Add a new request validator and document its request/response in Swagger.
- [ ] Add a user-facing loading state to the resend-verification button.
- [ ] Replace the in-memory rate-limit store with a shared store in a multi-instance deployment.
- [ ] Write tests for expired verification codes and invalid reset tokens.

<details>
<summary>Self-check questions (expand when ready)</summary>

1. What is the difference between a route, middleware, and controller?
2. Why does the API read the JWT from an HTTP-only cookie instead of browser local storage?
3. What work happens before the signup controller runs?
4. Why does `checkAuth` need both a JWT and a database lookup?
5. How does changing `tokenVersion` invalidate a previously issued token?
6. Which app checks the password's minimum length and maximum UTF-8 byte length?
7. What data is deliberately removed by the user model's JSON transform?
8. Why does the reset-email endpoint return a generic message?
9. Which files need changes to add a new authenticated endpoint end to end?
10. Which local environment value controls the frontend origin, and where does the API base URL come from in React?

</details>

### Suggested answers

<details>
<summary>Show the answers</summary>

1. A route maps an HTTP method/path; middleware checks or transforms a request before the controller; a controller implements endpoint behavior and sends a response.
2. An HTTP-only cookie is not available to ordinary page JavaScript, reducing exposure to script-based token theft. Cookie sessions still require careful origin/CSRF configuration.
3. The route applies a limiter, field validators, and the validation-error handler.
4. JWT checks signature/expiry; the database confirms the account still exists, is verified, and has the current session version.
5. The token carries the old version; protected middleware compares it to the incremented database value and rejects it.
6. The backend validator enforces these requirements; the browser strength meter is advisory.
7. Password, verification/reset tokens and expirations, tokenVersion, and Mongoose's internal `__v`.
8. To avoid revealing whether an email is registered.
9. Usually the controller, route, validation (if input exists), OpenAPI spec, Zustand action, and a page or component; add tests where available.
10. `CLIENT_URL` is the backend's allowed client origin and reset-link origin. The frontend API base is `VITE_API_URL`, falling back to `http://localhost:5000/api/auth`.

</details>

## Project file map

| Area | Files | Responsibility |
|---|---|---|
| Backend startup | [`backend/index.js`](../backend/index.js), [`backend/config/env.js`](../backend/config/env.js) | Load environment, create and configure Express app, mount routes/docs, start server. |
| Database | [`backend/db/connectDB.js`](../backend/db/connectDB.js), [`backend/models/user.model.js`](../backend/models/user.model.js) | Connect to MongoDB and define user data contract. |
| Auth API | [`backend/routes/auth.route.js`](../backend/routes/auth.route.js), [`backend/controllers/auth.controllers.js`](../backend/controllers/auth.controllers.js) | Route middleware stacks and authentication business logic. |
| Middleware | [`backend/middleware/validation.js`](../backend/middleware/validation.js), [`backend/middleware/rateLimiter.js`](../backend/middleware/rateLimiter.js), [`backend/middleware/verifyToken.js`](../backend/middleware/verifyToken.js) | Validate inputs, limit request rates, authenticate sessions. |
| Auth helpers | [`backend/utils/generateVerificationToken.js`](../backend/utils/generateVerificationToken.js), [`backend/utils/generateTokenAndSetCookie.js`](../backend/utils/generateTokenAndSetCookie.js) | Generate verification codes and signed cookie sessions. |
| Email | [`backend/email/email.config.js`](../backend/email/email.config.js), [`backend/email/emails.js`](../backend/email/emails.js), [`backend/email/emailTemplates.js`](../backend/email/emailTemplates.js) | Configure SMTP, send messages, define HTML templates. |
| API docs | [`backend/config/swagger.js`](../backend/config/swagger.js) | OpenAPI schema and reusable request/response helpers. |
| Frontend bootstrap | [`frontend/index.html`](../frontend/index.html), [`frontend/src/main.jsx`](../frontend/src/main.jsx), [`frontend/src/App.jsx`](../frontend/src/App.jsx) | Browser document, React root, route tree and route guards. |
| Frontend state | [`frontend/src/store/authStore.jsx`](../frontend/src/store/authStore.jsx) | Shared user/session state and Axios actions. |
| Pages | [`frontend/src/pages/`](../frontend/src/pages/) | Signup, login, verification, recovery, reset, and dashboard screens. |
| Components | [`frontend/src/components/`](../frontend/src/components/) | Reusable form input, animation decoration, spinner, password meter. |
| Frontend utilities/styles | [`frontend/src/utils/date.js`](../frontend/src/utils/date.js), [`frontend/src/index.css`](../frontend/src/index.css), [`frontend/vite.config.js`](../frontend/vite.config.js) | Date formatting, Tailwind entry, and Vite plugin setup. |

**You have reached the end of the tour.** To cement the concepts, trace one request from a page event all the way to its Mongoose query and back to the rendered UI.
