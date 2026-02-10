# PadelApp - Sistema de Gestión de Turnos

Sistema completo de gestión de turnos para clubes de pádel, desarrollado con Django REST Framework y React.

## Stack Tecnológico

### Backend
- Django 5.0 + Django REST Framework
- PostgreSQL 15
- JWT Authentication (djangorestframework-simplejwt)
- Docker

### Frontend
- React 18
- Vite
- Zustand (State Management)
- TailwindCSS
- React Big Calendar
- Recharts

## Características Principales

- **Gestión de Canchas**: CRUD completo de canchas de pádel
- **Gestión de Turnos**: Reservas, cancelaciones y cierres de turnos
- **Consumos**: Registro de productos vendidos durante los turnos
- **Caja Diaria**: Reportes de facturación y métodos de pago
- **Historial**: Consulta de turnos pasados con filtros avanzados
- **Roles de Usuario**: Administrador y Recepción

## Instalación y Uso

### Prerequisitos

- Docker y Docker Compose instalados
- Git

### Pasos de instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd padelapp
```

2. Copiar el archivo de variables de entorno:
```bash
cp backend/.env.example backend/.env
```

3. Levantar los servicios con Docker Compose:
```bash
docker-compose up --build
```

4. En otra terminal, crear un superusuario:
```bash
docker-compose exec backend python manage.py createsuperuser
```

5. Cargar datos de ejemplo (opcional):
```bash
docker-compose exec backend python manage.py loaddata fixtures/initial_data.json
```

### Acceso a la aplicación

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/docs/

### Usuarios de prueba

Después de cargar los fixtures, puedes usar:
- **Admin**: admin / admin123
- **Recepción**: recepcion / recepcion123

## Estructura del Proyecto

```
padelapp/
├── backend/
│   ├── apps/
│   │   ├── users/          # Autenticación y usuarios
│   │   ├── courts/         # Gestión de canchas
│   │   ├── bookings/       # Gestión de turnos
│   │   ├── products/       # Productos y consumos
│   │   └── payments/       # Reportes y caja
│   ├── config/             # Configuración Django
│   └── fixtures/           # Datos de ejemplo
├── frontend/
│   └── src/
│       ├── components/     # Componentes React
│       ├── pages/          # Vistas principales
│       ├── store/          # Zustand stores
│       ├── services/       # API clients
│       └── utils/          # Utilidades
└── docker-compose.yml
```

## API Endpoints

### Autenticación
- `POST /api/auth/login/` - Login
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/auth/me/` - Usuario actual

### Canchas
- `GET /api/courts/` - Listar canchas
- `POST /api/courts/` - Crear cancha (admin)
- `GET /api/courts/{id}/` - Detalle de cancha
- `PUT /api/courts/{id}/` - Actualizar cancha (admin)

### Turnos
- `GET /api/bookings/` - Listar turnos
- `GET /api/bookings/calendar/` - Vista calendario
- `POST /api/bookings/` - Crear turno
- `PATCH /api/bookings/{id}/cancel/` - Cancelar turno
- `POST /api/bookings/{id}/close/` - Cerrar turno

### Productos
- `GET /api/products/` - Listar productos
- `POST /api/products/` - Crear producto (admin)

### Consumos
- `POST /api/consumptions/` - Agregar consumo
- `DELETE /api/consumptions/{id}/` - Eliminar consumo

### Reportes
- `GET /api/reports/daily-summary/?date=YYYY-MM-DD` - Resumen diario
- `GET /api/reports/history/` - Historial con filtros

## Desarrollo

### Backend

Para hacer migraciones:
```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

Para entrar al shell de Django:
```bash
docker-compose exec backend python manage.py shell
```

### Frontend

Para instalar nuevas dependencias:
```bash
cd frontend
npm install <package-name>
```

## Testing

### Backend
```bash
docker-compose exec backend pytest
```

### Frontend
```bash
cd frontend
npm test
```

## Extensibilidad Futura

El sistema está preparado para integrar:
- Webhooks para notificaciones
- Integración con WhatsApp vía n8n
- Sistema de pagos online
- Reportes avanzados y estadísticas

## Licencia

Proyecto privado - Todos los derechos reservados

## Contacto

Para soporte o consultas, contactar al equipo de desarrollo.
