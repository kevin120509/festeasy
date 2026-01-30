# Etapa 1: Compilar la aplicación Angular
FROM node:20 AS build
WORKDIR /app

# Copiar archivos de dependencias e instalar
COPY package.json package-lock.json ./
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación para producción
# El output path por defecto en Angular 17+ es dist/<project-name>/browser
RUN npm run build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:stable-alpine

# Copiar los artefactos de construcción desde la etapa de compilación
COPY --from=build /app/dist/festeasy-frontend/browser /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80