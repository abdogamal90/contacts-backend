# Contacts Backend Startup Checklist

Use this guide each time you run the project to make sure database and server are correctly set up.

## 1) Preflight Checks

Run from project root:

```bash
pwd
ls -1
node -v
npm -v
docker --version
docker compose version
```

Install dependencies if needed:

```bash
npm install
```

## 2) Environment Check

Make sure .env has at least these keys:

```env
JWT_SECRET=your_secret
PORT=8000
MONGO_URL=mongodb://root:example@localhost:27018/contacts_app?authSource=admin
```

Important:
- For local Node run (node/nodemon on host), use localhost:27018 in MONGO_URL.
- For API running inside Docker Compose, use mongo:27017 in MONGO_URL.

## 3) Start MongoDB (Docker)

```bash
docker compose up -d mongo
docker compose ps
docker compose logs --tail=100 mongo
```

Healthy mongo should show state: Up (healthy).

## 4) Verify Database Exists

List databases:

```bash
docker exec contacts-mongo mongosh \
	--username root \
	--password example \
	--authenticationDatabase admin \
	--quiet \
	--eval "db.adminCommand({ listDatabases: 1 }).databases.map(d => d.name)"
```

Check if contacts_app exists (true/false):

```bash
docker exec contacts-mongo mongosh \
	--username root \
	--password example \
	--authenticationDatabase admin \
	--quiet \
	--eval "db.adminCommand({ listDatabases: 1 }).databases.some(d => d.name === 'contacts_app')"
```

List collections in contacts_app:

```bash
docker exec contacts-mongo mongosh \
	--username root \
	--password example \
	--authenticationDatabase admin \
	--quiet \
	--eval "db.getSiblingDB('contacts_app').getCollectionNames()"
```

## 5) Start Backend Server

### Option A: Run Node locally (recommended for this workspace)

```bash
npm run dev
```

Expected startup logs:
- MongoDB connected
- Contact indexes synced
- localhost:8000

### Option B: Run full stack with Docker Compose

```bash
docker compose up --build
```

If API keeps restarting, inspect logs:

```bash
docker compose logs --tail=200 api
```

## 6) Quick API Smoke Tests

Health by 404 check (server should reply JSON Not Found):

```bash
curl -i http://localhost:8000/
```

Auth login endpoint validation check (should return 400 if body missing):

```bash
curl -i -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{}'
```

## 7) Create Admin User (Recommended Flow)

Because passwords are bcrypt-hashed in your app, safest flow is:

1. Register normal user via API.
2. Promote that user role to admin in Mongo.

### 7.1 Register user

```bash
curl -X POST http://localhost:8000/api/auth/register \
	-H "Content-Type: application/json" \
	-d '{
		"username": "admin",
		"email": "admin@example.com",
		"password": "Admin@123456"
	}'
```

### 7.2 Promote to admin role in Mongo

```bash
docker exec contacts-mongo mongosh \
	--username root \
	--password example \
	--authenticationDatabase admin \
	--quiet \
	--eval "db.getSiblingDB('contacts_app').users.updateOne({ username: 'admin' }, { \$set: { role: 'admin', updatedAt: new Date() } })"
```

### 7.3 Verify admin record

```bash
docker exec contacts-mongo mongosh \
	--username root \
	--password example \
	--authenticationDatabase admin \
	--quiet \
	--eval "db.getSiblingDB('contacts_app').users.find({ username: 'admin' }, { username: 1, email: 1, role: 1 }).toArray()"
```

## 8) Create Admin User Directly in Mongo (Advanced)

Only use this if API register is unavailable. You must store a bcrypt hash, not plain password.

Generate bcrypt hash with Node:

```bash
HASH=$(node -e "console.log(require('bcryptjs').hashSync('Admin@123456', 10))")
echo "$HASH"
```

Insert admin user directly:

```bash
docker exec contacts-mongo mongosh \
	--username root \
	--password example \
	--authenticationDatabase admin \
	--quiet \
	--eval "db.getSiblingDB('contacts_app').users.insertOne({ username: 'admin2', email: 'admin2@example.com', password: '$HASH', role: 'admin', createdAt: new Date(), updatedAt: new Date() })"
```

## 9) Login as Admin

```bash
curl -X POST http://localhost:8000/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{
		"username": "admin",
		"password": "Admin@123456"
	}'
```

Success response includes JWT token.

## 10) Common Issues and Fixes

1. Error: getaddrinfo ENOTFOUND mongo
- Cause: Using docker hostname mongo while running Node on host.
- Fix: Set MONGO_URL to localhost:27018 for local Node run.

2. Error: Connection operation buffering timed out
- Cause: Mongo not reachable or wrong URL/credentials.
- Fix: confirm mongo container is healthy, then test listDatabases command above.

3. Docker API container restart with ENOENT package.json
- Cause: wrong bind mount source path in an old compose project/container.
- Fix:

```bash
docker compose down
docker compose up --build
```

4. Login fails with Invalid credentials
- Cause: user not created, wrong password, or password stored as plain text.
- Fix: re-register via API, or reinsert user with bcrypt hash.

## 11) One-Command Daily Startup Sequence

```bash
docker compose up -d mongo && npm run dev
```

Then run login test curl to confirm end-to-end readiness.
