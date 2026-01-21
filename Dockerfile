# Etapa 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias con timeout extendido
RUN npm install --prefer-offline --no-audit --progress=false

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Etapa 2: Servidor Nginx
FROM nginx:alpine

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos compilados desde la etapa de build
COPY --from=build /app/dist/festeasy-frontend/browser /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
