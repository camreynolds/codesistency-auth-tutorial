const errorResponse = {
  description: "The request could not be completed.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/MessageResponse" },
    },
  },
};

const validationErrorResponse = {
  description: "The request body is invalid.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/MessageResponse" },
      example: { success: false, message: "Please provide a valid email." },
    },
  },
};

const rateLimitResponse = {
  description: "Too many requests. See the response message for retry guidance.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/MessageResponse" },
    },
  },
};

const jsonRequest = (schema) => ({
  required: true,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
});

const jsonResponse = (description, schema, example) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` },
      ...(example ? { example } : {}),
    },
  },
});

const messageExample = (success, message) => ({ success, message });

export const swaggerSpecification = {
  openapi: "3.0.3",
  info: {
    title: "Codesistency Auth API",
    version: "1.0.0",
    description:
      "Authentication API for account creation, email verification, login, and password recovery. Successful login and email verification set an HTTP-only `token` cookie.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Authentication", description: "Account and session operations" },
    { name: "Email verification", description: "Email verification operations" },
    { name: "Password recovery", description: "Password reset operations" },
  ],
  paths: {
    "/api/auth/signup": {
      post: {
        tags: ["Authentication"],
        summary: "Create an account",
        description:
          "Creates an unverified account and emails a six-digit verification code. The response does not reveal whether an email is already registered.",
        requestBody: jsonRequest("SignupRequest"),
        responses: {
          201: jsonResponse("Account created.", "UserResponse", {
            success: true,
            message: "User created successfully",
            user: {
              _id: "66a000000000000000000001",
              email: "alex@example.com",
              name: "Alex",
              isVerified: false,
              lastLogin: "2026-01-15T12:00:00.000Z",
              createdAt: "2026-01-15T12:00:00.000Z",
              updatedAt: "2026-01-15T12:00:00.000Z",
            },
          }),
          400: errorResponse,
          429: rateLimitResponse,
          500: errorResponse,
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in",
        description:
          "Authenticates a verified account and sets an HTTP-only `token` cookie (valid for seven days).",
        requestBody: jsonRequest("LoginRequest"),
        responses: {
          200: jsonResponse("Login successful.", "UserResponse", {
            success: true,
            message: "Logged successfully.",
            user: {
              _id: "66a000000000000000000001",
              email: "alex@example.com",
              name: "Alex",
              isVerified: true,
              lastLogin: "2026-01-15T12:00:00.000Z",
              createdAt: "2026-01-15T12:00:00.000Z",
              updatedAt: "2026-01-15T12:00:00.000Z",
            },
          }),
          400: errorResponse,
          403: jsonResponse(
            "The account must be verified before logging in.",
            "MessageResponse",
            messageExample(false, "Please verify your email before logging in.")
          ),
          429: rateLimitResponse,
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Log out",
        description:
          "Revokes all sessions for the authenticated user and clears the `token` cookie.",
        security: [{ cookieAuth: [] }],
        responses: {
          200: jsonResponse(
            "Logout successful.",
            "MessageResponse",
            messageExample(true, "Logged out successfully.")
          ),
          401: errorResponse,
          429: rateLimitResponse,
          500: errorResponse,
        },
      },
    },
    "/api/auth/check-auth": {
      get: {
        tags: ["Authentication"],
        summary: "Get the current authenticated user",
        description: "Returns the current user when the session cookie is valid.",
        security: [{ cookieAuth: [] }],
        responses: {
          200: jsonResponse("Authenticated user.", "UserResponse", {
            success: true,
            user: {
              _id: "66a000000000000000000001",
              email: "alex@example.com",
              name: "Alex",
              isVerified: true,
              lastLogin: "2026-01-15T12:00:00.000Z",
              createdAt: "2026-01-15T12:00:00.000Z",
              updatedAt: "2026-01-15T12:00:00.000Z",
            },
          }),
          400: errorResponse,
          401: errorResponse,
        },
      },
    },
    "/api/auth/verify-email": {
      post: {
        tags: ["Email verification"],
        summary: "Verify an email address",
        description:
          "Verifies the account using the email and six-digit code. On success, sets the authenticated `token` cookie.",
        requestBody: jsonRequest("VerifyEmailRequest"),
        responses: {
          200: jsonResponse("Email verified.", "UserResponse", {
            success: true,
            message: "Email verified successfully",
            user: {
              _id: "66a000000000000000000001",
              email: "alex@example.com",
              name: "Alex",
              isVerified: true,
              lastLogin: "2026-01-15T12:00:00.000Z",
              createdAt: "2026-01-15T12:00:00.000Z",
              updatedAt: "2026-01-15T12:00:00.000Z",
            },
          }),
          400: errorResponse,
          429: rateLimitResponse,
          500: errorResponse,
        },
      },
    },
    "/api/auth/resend-verification": {
      post: {
        tags: ["Email verification"],
        summary: "Resend an email verification code",
        description:
          "Sends a new code if the email belongs to an unverified account. Returns the same response whether or not such an account exists.",
        requestBody: jsonRequest("EmailRequest"),
        responses: {
          200: jsonResponse(
            "A generic response is returned to prevent account enumeration.",
            "MessageResponse",
            messageExample(
              true,
              "If an unverified account exists for that email, a verification code has been sent."
            )
          ),
          400: validationErrorResponse,
          429: rateLimitResponse,
          500: errorResponse,
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Password recovery"],
        summary: "Request a password reset",
        description:
          "Sends a password reset link when the email belongs to an account. The same response is returned whether or not the account exists.",
        requestBody: jsonRequest("EmailRequest"),
        responses: {
          200: jsonResponse(
            "A generic response is returned to prevent account enumeration.",
            "MessageResponse",
            messageExample(
              true,
              "If an account exists for that email, a password reset link has been sent."
            )
          ),
          400: errorResponse,
          429: rateLimitResponse,
        },
      },
    },
    "/api/auth/reset-password/{token}": {
      post: {
        tags: ["Password recovery"],
        summary: "Reset a password",
        description:
          "Uses the one-hour reset token sent by email. A successful reset revokes existing sessions.",
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            description: "Plaintext reset token from the emailed reset link.",
            schema: { type: "string" },
          },
        ],
        requestBody: jsonRequest("PasswordRequest"),
        responses: {
          200: jsonResponse(
            "Password reset successful.",
            "MessageResponse",
            messageExample(true, "Password reset successfully.")
          ),
          400: errorResponse,
          429: rateLimitResponse,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description:
          "HTTP-only JWT cookie, set by login or successful email verification. Browser clients should send credentials with requests.",
      },
    },
    schemas: {
      SignupRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            maxLength: 100,
            example: "Alex",
          },
          email: {
            type: "string",
            format: "email",
            maxLength: 254,
            example: "alex@example.com",
          },
          password: {
            type: "string",
            minLength: 6,
            maxLength: 72,
            description: "Maximum 72 UTF-8 bytes.",
            example: "correct-horse-battery",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "alex@example.com" },
          password: {
            type: "string",
            minLength: 6,
            maxLength: 72,
            description: "Maximum 72 UTF-8 bytes.",
            example: "correct-horse-battery",
          },
        },
      },
      EmailRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            maxLength: 254,
            example: "alex@example.com",
          },
        },
      },
      VerifyEmailRequest: {
        type: "object",
        required: ["email", "code"],
        properties: {
          email: {
            type: "string",
            format: "email",
            maxLength: 254,
            example: "alex@example.com",
          },
          code: {
            type: "string",
            pattern: "^\\d{6}$",
            example: "123456",
          },
        },
      },
      PasswordRequest: {
        type: "object",
        required: ["password"],
        properties: {
          password: {
            type: "string",
            minLength: 6,
            maxLength: 72,
            description: "Maximum 72 UTF-8 bytes.",
            example: "new-correct-horse",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66a000000000000000000001" },
          email: { type: "string", format: "email", example: "alex@example.com" },
          name: { type: "string", example: "Alex" },
          isVerified: { type: "boolean", example: true },
          lastLogin: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MessageResponse: {
        type: "object",
        required: ["success", "message"],
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      UserResponse: {
        type: "object",
        required: ["success"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
    },
  },
};
