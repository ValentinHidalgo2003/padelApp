# PadelApp - Guía de Inicio Rápido

## Prerequisitos

- Docker y Docker Compose instalados
- Git

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd padelapp
```

### 2. Configurar variables de entorno (opcional)

Si deseas personalizar la configuración, copia el archivo de ejemplo:

```bash
cp backend/.env.example backend/.env
```

Luego edita `backend/.env` con tus valores.

### 3. Iniciar los servicios

```bash
docker-compose up --build
```

Este comando:
- Construirá las imágenes de Docker para backend y frontend
- Iniciará PostgreSQL
- Ejecutará las migraciones automáticamente
- Levantará el backend en el puerto 8000
- Levantará el frontend en el puerto 5173

### 4. Cargar datos de ejemplo

En otra terminal, ejecuta:

```bash
docker-compose exec backend python manage.py seed_data
```

Esto creará:
- Usuarios de ejemplo (admin y recepción)
- Canchas de ejemplo
- Productos de ejemplo
- Algunos turnos de prueba

### 5. Acceder a la aplicación

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/
- **API Docs (Swagger)**: http://localhost:8000/api/docs/

### Credenciales de Acceso

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Recepción:**
- Usuario: `recepcion`
- Contraseña: `recepcion123`

## Comandos Útiles

### Detener los servicios

```bash
docker-compose down
```

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Ejecutar migraciones manualmente

```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

### Crear un superusuario

```bash
docker-compose exec backend python manage.py createsuperuser
```

### Acceder al shell de Django

```bash
docker-compose exec backend python manage.py shell
```

### Acceder a la base de datos PostgreSQL

```bash
docker-compose exec db psql -U padeluser -d padelapp
```

### Reiniciar un servicio específico

```bash
docker-compose restart backend
docker-compose restart frontend
```

### Reconstruir e iniciar desde cero

```bash
docker-compose down -v  # Elimina también los volúmenes
docker-compose up --build
```

## Estructura del Proyecto

```
padelapp/
├── backend/          # Django + DRF
├── frontend/         # React + Vite
├── docker-compose.yml
└── README.md
```

## Desarrollo

### Backend

El backend usa hot-reload, por lo que los cambios en el código Python se reflejarán automáticamente.

### Frontend

El frontend también usa hot-reload. Los cambios en React se verán inmediatamente en el navegador.

### Instalar nuevas dependencias

**Backend:**
1. Agregar al `requirements.txt`
2. Reconstruir: `docker-compose up --build backend`

**Frontend:**
1. Agregar al `package.json` o ejecutar:
```bash
docker-compose exec frontend npm install <paquete>
```

## Troubleshooting

### El backend no inicia

1. Verifica que PostgreSQL esté funcionando:
```bash
docker-compose ps
```

2. Revisa los logs:
```bash
docker-compose logs backend
```

### El frontend no carga

1. Verifica que el puerto 5174 no esté en uso
2. Revisa los logs del frontend:
```bash
docker-compose logs frontend
```

### Errores de permisos en Linux

Si tienes problemas de permisos, puedes necesitar ajustar el ownership:
```bash
sudo chown -R $USER:$USER .
```

### Resetear la base de datos

```bash
docker-compose down -v
docker-compose up --build
docker-compose exec backend python manage.py seed_data
```

## Próximos Pasos

1. Explora la API en http://localhost:8000/api/docs/
2. Prueba crear turnos en el calendario
3. Cierra turnos y revisa el resumen diario
4. Gestiona canchas y productos desde el panel de administración

## Soporte

Para reportar bugs o solicitar features, contacta al equipo de desarrollo.
