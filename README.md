# codesistency-auth-tutorial
Project to explore auth authentication and password recovery in a MERN stack.

# 🚀 Full-Stack Authentication System (MERN Stack)

Un sistema de autenticación moderno, completo y seguro, desarrollado paso a paso siguiendo el curso avanzado de autenticación de **Codesistency**. Este proyecto cubre de extremo a extremo la implementación del **Backend**, configuración de bases de datos, lógica de envío de correos electrónicos transaccionales con **Nodemailer** y SMTP de Mailtrap, vistas e interacciones del **Frontend** en **React**, manejo de sesiones seguras mediante **JWT** y despliegue final de la aplicación.

---

## 🎥 Referencia del Proyecto
Este proyecto está basado en los conceptos, arquitectura y desarrollo paso a paso explicados en el siguiente video educativo:
* **[Advanced MERN Auth Course: Email Verification, Password Recovery, and Welcome Emails](https://www.youtube.com/watch?v=pmvEgZC55Cg)**

---

## 📚 Interactive Project Guide

For a step-by-step learning path, expandable explanations of the project's backend and frontend functions, API flows, technologies, setup, and practice exercises, open the [Interactive MERN Project Guide](docs/PROJECT_GUIDE.md).

---

## 📋 Tabla de Contenidos

1. [⚙️ Configuración del Backend](#️-configuración-del-backend)
2. [🗄️ Configuración de la Base de Datos](#️-configuración-de-la-base-de-datos)
3. [🔐 Endpoints de Autenticación y Seguridad](#-endpoints-de-autenticación-y-seguridad)
4. [📧 Sistema de Correo Electrónico (Nodemailer)](#-sistema-de-correo-electrónico-nodemailer)
5. [🌐 Configuración del Frontend y Vistas UI](#-configuración-del-frontend-y-vistas-ui)
6. [🔄 Implementación de Lógica y Consumo de Endpoints](#-implementación-de-lógica-y-consumo-de-endpoints)

---

## ⚙️ Configuración del Backend

*   **Backend Setup**: Inicialización del servidor con Node.js y Express, configuración de variables de entorno (`dotenv`), `cookie-parser` y middlewares de seguridad como CORS.
*   **Check Auth Endpoint**: Endpoint protegido para verificar el estado de sesión actual del usuario autenticado al refrescar o cargar la aplicación cliente.

---

## 🗄️ Configuración de la Base de Datos

*   **Database Setup**: Conexión a MongoDB mediante Mongoose, definición de esquemas de usuario con validaciones y marcas de tiempo (`timestamps`) automáticas.

### Production deployment notes

* Set `JWT_SECRET` to a generated secret, never the placeholder in `.env.example`.
* Set `CLIENT_URL` to the exact frontend origin. The authentication cookie uses `SameSite=Strict`, so deploy the frontend and API on the same site (subdomains of the same registrable domain are same-site).
* Email addresses are now normalized to lowercase. Before deploying this change against an existing database, back up the data, find addresses that collide after lowercasing, resolve those accounts, and migrate the remaining addresses to lowercase. Do not apply a case-insensitive unique index until duplicates are resolved.
* Email verification requires both the normalized email address and its six-digit code, preventing a code collision from verifying a different account. Logging out revokes all JWT sessions for that user.

---

## 🔐 Endpoints de Autenticación y Seguridad

El núcleo del sistema de autenticación incluye los siguientes endpoints gestionados con tokens JWT almacenados en cookies HTTP-only seguras:

### API documentation

Start the backend with `npm run dev`, then open [http://localhost:5000/api-docs](http://localhost:5000/api-docs) for the interactive Swagger UI or [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json) for the OpenAPI specification. The documented session endpoints use the HTTP-only `token` cookie set by login or successful email verification.

*   **Signup Endpoint**: Registro de nuevos usuarios con cifrado de contraseñas mediante **bcryptjs**.
*   **Login Endpoint**: Validación de credenciales y generación de sesiones activas.
*   **Logout Endpoint**: Cierre de sesión seguro y destrucción de cookies de autenticación.
*   **Forgot Password Endpoint**: Generación de tokens seguros y marcas de tiempo para la recuperación de cuentas.
*   **Reset Password Endpoint**: Validación de tokens y actualización segura de credenciales.

---

## 📧 Sistema de Correo Electrónico (Nodemailer)

Integración de **Nodemailer** con el servidor SMTP de Mailtrap para enviar correos transaccionales:

*   **Building a Welcome Email Template**: Diseño e implementación de plantillas HTML profesionales para dar la bienvenida a nuevos usuarios.
*   **Sending Verify Account Email**: Envío automatizado de códigos/tokens de verificación de 6 dígitos.
*   **Verify Email Endpoint**: Validación del código de verificación enviado alfanuméricamente para activar las cuentas de usuario en la base de datos.

---

## 🌐 Configuración del Frontend y Vistas UI

Construcción de la interfaz de usuario utilizando **React**, **Vite**, **Tailwind CSS** y **Framer Motion** para animaciones fluidas:

*   **Frontend Setup**: Inicialización del cliente, enrutamiento con `react-router-dom` y diseño de componentes reutilizables (como campos de entrada y medidores de seguridad de contraseñas).
*   **Signup Page UI**: Interfaz visual y formulario de registro.
*   **Login Page UI**: Interfaz visual y formulario de inicio de sesión.
*   **Email Verification Page UI**: Pantalla interactiva con validación de inputs divididos para códigos de verificación.
*   **Dashboard Page**: Panel de control principal con visualización de actividad de usuario, fechas de registro e inicio de sesión.

---

## 🔄 Implementación de Lógica y Consumo de Endpoints

*   **Implementing Signup**: Conexión del formulario de registro con el backend y redirección automática.
*   **Implementing Email Verification**: Lógica del cliente para gestionar la confirmación de cuentas.
*   **Protecting Our Routes**: Creación de rutas protegidas (*Guards*) en React para restringir el acceso a usuarios no autenticados o no verificados.
*   **Implementing Login**: Gestión de estados globales con **Zustand** y almacenamiento de sesiones.
*   **Implementing Forgot Password**: Lógica del cliente para solicitar y procesar la recuperación de credenciales.

---

## 🛠️ Tecnologías Utilizadas

*   **Backend:** Node.js, Express, Mongoose, JWT, BcryptJS, Mailtrap SDK
*   **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Zustand, Axios, React Hot Toast, Lucide React
*   **Base de Datos:** MongoDB