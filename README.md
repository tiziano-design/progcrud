# Gestión de Socios - Gimnasio

Aplicación fullstack CRUD para gestionar socios de un gimnasio utilizando Node.js, Express, Prisma y MySQL en el backend, y HTML, CSS y JavaScript vanilla en el frontend.

## Tecnologías utilizadas

- Node.js
- Express
- Prisma ORM
- MySQL
- HTML
- CSS
- JavaScript Vanilla

## Estructura del proyecto

- backend/: servidor Express y configuración de Prisma
- frontend/: interfaz web para listar, crear, editar y eliminar socios
- backend/prisma/: schema.prisma y migraciones

## Requisitos previos

- Node.js instalado
- MySQL en ejecución
- Una base de datos creada para el proyecto

## Instalación

1. Entrar en la carpeta del backend:
   ```bash
   cd backend
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear un archivo `.env` dentro de la carpeta `backend` con la siguiente estructura:
   ```env
   DATABASE_URL="mysql://usuario:contraseña@localhost:3306/nombre_base"
   ```

4. Ejecutar las migraciones de Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```

## Ejecución

### Backend

```bash
cd backend
node index.js
```

El servidor quedará disponible en:
```text
http://localhost:3000
```

### Frontend

Abrir el archivo:
```text
frontend/index.html
```

o servir la carpeta frontend con un servidor estático si se desea.

## Funcionalidades

- Listado de socios
- Alta de socios
- Edición de socios
- Eliminación de socios
- Cambio de estado de socios
- Validaciones básicas en backend y frontend
- Mensajes de éxito y error en la interfaz

## Base de datos

El modelo Prisma se encuentra en:
- backend/prisma/schema.prisma

Las migraciones se encuentran en:
- backend/prisma/migrations
