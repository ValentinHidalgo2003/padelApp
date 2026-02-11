# Render - Guía Rápida de Despliegue

## 🚀 Opción 1: Despliegue con Blueprint (Recomendado)

El archivo `render.yaml` permite desplegar todos los servicios de una vez.

### Pasos:

1. **Sube tu código a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TU_USUARIO/padelapp.git
   git push -u origin main
   ```

2. **Accede a Render:**
   - Ve a https://dashboard.render.com/
   - Click en **"New +"** → **"Blueprint"**

3. **Conecta tu repositorio:**
   - Selecciona el repositorio `padelapp`
   - Render detectará automáticamente el `render.yaml`
   - Click en **"Apply"**

4. **Espera el despliegue:**
   - Render creará automáticamente:
     - PostgreSQL database
     - Backend (Django)
     - Frontend (React)
   - **Las migraciones se ejecutan automáticamente** ✨
   - Toma ~5-10 minutos

5. **Configuración post-despliegue (Opcional):**
   ```bash
   # Solo si quieres datos de prueba, ejecuta desde el Shell del backend:
   python manage.py seed_data
   ```

6. **¡Listo!**
   - Frontend: `https://padelapp-frontend.onrender.com`
   - Backend: `https://padelapp-backend.onrender.com`
   - Admin: `https://padelapp-backend.onrender.com/admin/`
   
   **Nota**: Las migraciones ya se ejecutaron automáticamente durante el despliegue ✅

---

## 📝 Opción 2: Despliegue Manual (Paso a Paso)

Si prefieres más control, sigue la guía completa en `RENDER_DEPLOYMENT.md`

---

## ⚙️ Variables de Entorno Importantes

### Backend:
- `SECRET_KEY`: Clave secreta de Django (Render la genera automáticamente en Blueprint)
- `DEBUG`: False en producción
- `ALLOWED_HOSTS`: Tu dominio de Render
- `DB_*`: Configuración de PostgreSQL (automática con Blueprint)
- `CORS_ALLOWED_ORIGINS`: URL del frontend

### Frontend:
- `VITE_API_URL`: URL del backend (ej: `https://padelapp-backend.onrender.com`)

---

## 🔧 Comandos Útiles Post-Despliegue

### Acceder al Shell del Backend

1. Ve a tu servicio de backend en Render
2. Click en **"Shell"** en el menú lateral
3. Ejecuta:

```bash
# Migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Cargar datos de prueba
python manage.py seed_data

# Ver usuarios existentes
python manage.py shell
>>> from apps.users.models import User
>>> User.objects.all()
```

---

## 📊 Monitoreo

- **Logs**: Ve a tu servicio → "Logs"
- **Métricas**: Ve a tu servicio → "Metrics"
- **Health Check**: `https://tu-backend.onrender.com/api/health/`

---

## 🐛 Solución de Problemas Comunes

### Backend no inicia
```bash
# Revisa los logs en Render
# Verifica que las migraciones se ejecutaron
# Verifica la conexión a la base de datos
```

### CORS Error
```bash
# Verifica que CORS_ALLOWED_ORIGINS incluya tu frontend
# Formato: https://padelapp-frontend.onrender.com (sin trailing slash)
```

### Base de datos no conecta
```bash
# Usa la Internal Database URL (no External)
# Verifica que backend y DB estén en la misma región
```

---

## 🔄 Actualizar la Aplicación

```bash
# En tu máquina local:
git add .
git commit -m "Descripción de cambios"
git push origin main

# Render redesplegará automáticamente (si auto-deploy está activo)
```

---

## 💰 Costos

**Plan Free (Demo):**
- Todo gratis
- Backend duerme después de 15 min de inactividad
- PostgreSQL se elimina después de 90 días sin uso

**Plan Starter (Producción):**
- ~$14-21/mes
- Servicios siempre activos
- Backups automáticos de BD

---

## 📚 Enlaces Útiles

- [Documentación completa](./RENDER_DEPLOYMENT.md)
- [Render Docs](https://render.com/docs)
- [Dashboard Render](https://dashboard.render.com/)

---

## ✅ Checklist Post-Despliegue

- [ ] Todos los servicios están "Live" (verde)
- [ ] Migraciones ejecutadas
- [ ] Superusuario creado
- [ ] Login funciona
- [ ] Se pueden crear turnos
- [ ] CORS configurado (no hay errores en consola)
- [ ] Health check responde: `/api/health/`

---

**¡Éxito! Tu app está en producción** 🎉
