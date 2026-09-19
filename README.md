# codesistency-auth-tutorial
Project to explore auth athentication and password recovery in a MERN stack.

# 🚀 Full-Stack Authentication System (MERN Stack)

Un sistema de autenticación moderno, completo y seguro, desarrollado paso a paso siguiendo el curso avanzado de autenticación de **Codesistency**[cite: 1]. Este proyecto cubre de extremo a extremo la implementación del **Backend**, configuración de bases de datos, lógica de envío de correos electrónicos transaccionales con **Mailtrap**, vistas e interacciones del **Frontend** en **React**, manejo de sesiones seguras mediante **JWT** y despliegue final de la aplicación.

---

## 🎥 Referencia del Proyecto
Este proyecto está basado en los conceptos, arquitectura y desarrollo paso a paso explicados en el siguiente video educativo:
* **[Advanced MERN Auth Course: Email Verification, Password Recovery, and Welcome Emails](https://www.youtube.com/watch?v=pmvEgZC55Cg)**[cite: 1]

---

## 📋 Tabla de Contenidos

1. [⚙️ Configuración del Backend](#️-configuración-del-backend)
2. [🗄️ Configuración de la Base de Datos](#️-configuración-de-la-base-de-datos)
3. [🔐 Endpoints de Autenticación y Seguridad](#-endpoints-de-autenticación-y-seguridad)
4. [📧 Sistema de Correo Electrónico (Mailtrap)](#-sistema-de-correo-electrónico-mailtrap)
5. [🌐 Configuración del Frontend y Vistas UI](#-configuración-del-frontend-y-vistas-ui)
6. [🔄 Implementación de Lógica y Consumo de Endpoints](#-implementación-de-lógica-y-consumo-de-endpoints)

---

## ⚙️ Configuración del Backend

*   **Backend Setup**: Inicialización del servidor con Node.js y Express, configuración de variables de entorno (`dotenv`), `cookie-parser` y middlewares de seguridad como CORS[cite: 1].
*   **Check Auth Endpoint**: Endpoint protegido para verificar el estado de sesión actual del usuario autenticado al refrescar o cargar la aplicación cliente[cite: 1].

---

## 🗄️ Configuración de la Base de Datos

*   **Database Setup**: Conexión a MongoDB mediante Mongoose, definición de esquemas de usuario con validaciones y marcas de tiempo (`timestamps`) automáticas[cite: 1].

---

## 🔐 Endpoints de Autenticación y Seguridad

El núcleo del sistema de autenticación incluye los siguientes endpoints gestionados con tokens JWT almacenados en cookies HTTP-only seguras[cite: 1]:

*   **Signup Endpoint**: Registro de nuevos usuarios con cifrado de contraseñas mediante **bcryptjs**[cite: 1].
*   **Login Endpoint**: Validación de credenciales y generación de sesiones activas[cite: 1].
*   **Logout Endpoint**: Cierre de sesión seguro y destrucción de cookies de autenticación[cite: 1].
*   **Forgot Password Endpoint**: Generación de tokens seguros y marcas de tiempo para la recuperación de cuentas[cite: 1].
*   **Reset Password Endpoint**: Validación de tokens y actualización segura de credenciales[cite: 1].

---

## 📧 Sistema de Correo Electrónico (Mailtrap)

Integración completa con el SDK de **Mailtrap** para el envío de correos transaccionales[cite: 1]:

*   **Building a Welcome Email Template**: Diseño e implementación de plantillas HTML profesionales para dar la bienvenida a nuevos usuarios[cite: 1].
*   **Sending Verify Account Email**: Envío automatizado de códigos/tokens de verificación de 6 dígitos[cite: 1].
*   **Verify Email Endpoint**: Validación del código de verificación enviado alfanuméricamente para activar las cuentas de usuario en la base de datos[cite: 1].

---

## 🌐 Configuración del Frontend y Vistas UI

Construcción de la interfaz de usuario utilizando **React**, **Vite**, **Tailwind CSS** y **Framer Motion** para animaciones fluidas[cite: 1]:

*   **Frontend Setup**: Inicialización del cliente, enrutamiento con `react-router-dom` y diseño de componentes reutilizables (como campos de entrada y medidores de seguridad de contraseñas)[cite: 1].
*   **Signup Page UI**: Interfaz visual y formulario de registro[cite: 1].
*   **Login Page UI**: Interfaz visual y formulario de inicio de sesión[cite: 1].
*   **Email Verification Page UI**: Pantalla interactiva con validación de inputs divididos para códigos de verificación[cite: 1].
*   **Dashboard Page**: Panel de control principal con visualización de actividad de usuario, fechas de registro e inicio de sesión[cite: 1].

---

## 🔄 Implementación de Lógica y Consumo de Endpoints

*   **Implementing Signup**: Conexión del formulario de registro con el backend y redirección automática[cite: 1].
*   **Implementing Email Verification**: Lógica del cliente para gestionar la confirmación de cuentas[cite: 1].
*   **Protecting Our Routes**: Creación de rutas protegidas (*Guards*) en React para restringir el acceso a usuarios no autenticados o no verificados[cite: 1].
*   **Implementing Login**: Gestión de estados globales con **Zustand** y almacenamiento de sesiones[cite: 1].
*   **Implementing Forgot Password**: Lógica del cliente para solicitar y procesar la recuperación de credenciales[cite: 1].

---

## 🛠️ Tecnologías Utilizadas

*   **Backend:** Node.js, Express, Mongoose, JWT, BcryptJS, Mailtrap SDK[cite: 1].
*   **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Zustand, Axios, React Hot Toast, Lucide React[cite: 1].
*   **Base de Datos:** MongoDB[cite: 1].
http://googleusercontent.com/youtube_content/1
http://googleusercontent.com/youtube_content/2