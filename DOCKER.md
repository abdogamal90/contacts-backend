# Docker Setup for Contacts Backend

This project includes complete Docker configuration for both development and production environments.

## Quick Start

### Development Mode

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Start all services (backend and MongoDB):
   ```bash
   docker-compose up
   ```

3. Access the application:
   - Backend API: http://localhost:3000
   - MongoDB: localhost:27018

### Production Mode

1. Copy and configure production environment:
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your actual production values
   ```

2. Build and start production services:
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

3. Access the application:
   - Backend API: http://localhost:3000
   - MongoDB: localhost:27017

## File Structure

- `Dockerfile` - Production build (multi-stage, optimized)
- `Dockerfile.dev` - Development build (with hot reload)
- `.dockerignore` - Excludes unnecessary files from builds
- `.env.example` - Development environment template
- `.env.production.example` - Production environment template
- `docker-compose.yml` - Development orchestration
- `docker-compose.prod.yml` - Production orchestration

## Services

### API Service
- **Development**: Uses nodemon for hot reload, volume-mounted code
- **Production**: Optimized build, runs as non-root user
- **Port**: 3000

### MongoDB Service
- **Image**: MongoDB 6.0
- **Ports**: 27018 (dev), 27017 (prod)
- **Volumes**: Persistent data storage, backup directory mounted
- **Health Checks**: Automatic readiness verification

## Key Features

### Development Setup
✅ Hot reload with nodemon
✅ Volume mounting for instant code changes
✅ Full development dependencies
✅ Easy debugging with source maps

### Production Setup
✅ Multi-stage builds for smaller images
✅ Security hardening (non-root users)
✅ Optimized builds (production dependencies only)
✅ Log rotation configured
✅ Service dependencies properly configured

## Useful Commands

### Development

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View API logs only
docker-compose logs -f api

# Stop all services
docker-compose down

# Rebuild after dependency changes
docker-compose up --build

# Remove volumes (reset database)
docker-compose down -v
```

### Production

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Stop services
docker-compose -f docker-compose.prod.yml down

# Rebuild images
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Database Backup

```bash
# Backup MongoDB
docker exec contacts-mongo mongodump --username root --password example --authenticationDatabase admin --out /backup/$(date +%Y%m%d)

# Restore MongoDB
docker exec contacts-mongo mongorestore --username root --password example --authenticationDatabase admin /backup/YYYYMMDD
```

## Environment Variables

### Required Variables
- `JWT_SECRET` - Secret key for JWT token generation (MUST change in production)
- `MONGO_URL` - MongoDB connection string
- `MONGO_INITDB_ROOT_USERNAME` - MongoDB root username
- `MONGO_INITDB_ROOT_PASSWORD` - MongoDB root password

### Optional Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - API port (default: 3000)
- `MONGO_PORT` - MongoDB exposed port (default: 27018 dev, 27017 prod)
- `FRONTEND_ORIGINS` - Allowed CORS origins (comma-separated)

## Security Considerations

1. **Never commit** `.env` files to version control
2. **Change default passwords** in production
3. **Use strong JWT secrets** (at least 32 random characters)
4. **Set proper FRONTEND_ORIGINS** to prevent CORS abuse
5. **Regular backups** of MongoDB data
6. **Monitor logs** for security events

## Troubleshooting

### Port already in use
```bash
# Change ports in .env file
PORT=3001
MONGO_PORT=27019
```

### MongoDB connection refused
```bash
# Check if MongoDB is healthy
docker-compose ps
docker-compose logs mongo

# Wait for health check to pass
```

### Permission denied errors
```bash
# Fix ownership (development)
sudo chown -R $USER:$USER .
```

## Architecture

```
┌────────────────┐
│  Backend API   │
│ (Node.js:3000) │
└───────┬────────┘
        │
        │ Mongoose
        │
┌───────▼────────┐
│    MongoDB     │
│    (:27017)    │
└────────────────┘
```
