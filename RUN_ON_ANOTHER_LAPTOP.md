# Running SkillSphere on another laptop

Copy the whole project folder (zip it; you can skip `frontend/node_modules`, `__pycache__`, `presentation/`).
Make sure the `.env` file is included (it is hidden - use "show hidden files"); if missing, run `cp .env.example .env`.

## Option A - Docker (easiest, same on Mac / Windows / Linux)

1. Install **Docker Desktop** and start it.
2. In the project folder:
   ```bash
   docker compose up --build
   ```
   (wait until you see the backend say "Application startup complete")
3. In a **second terminal**, load the demo data:
   ```bash
   docker compose exec app python seed_all.py
   ```
4. Open **http://localhost:3000**

Stop: `Ctrl+C`, then `docker compose down`.

## Option B - Without Docker

Install: **Python 3.11+**, **Node.js 18+**, **PostgreSQL 15**.

### 1. Database (once)
```bash
psql -U postgres -c "CREATE USER skillhub WITH PASSWORD 'skillhub123';"
psql -U postgres -c "CREATE DATABASE skillhub OWNER skillhub;"
```
(Windows: use the "SQL Shell (psql)" app from the Postgres install.)

### 2. Backend (terminal 1, in project folder)
```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```
Leave it running (first start creates the tables).

### 3. Demo data (terminal 2, same folder, venv active)
```bash
python seed_all.py
```

### 4. Frontend (terminal 3)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000**

## Logins

| Role | Email | Password |
|---|---|---|
| Student | arjun.kumar@ceconline.edu (also priya.menon, rahul.sharma, sneha.pillai, karthik.nair, divya.thomas, arun.krishnan, meera.suresh) | Test@1234 |
| Admin | admin@ceconline.edu | Admin@123 |

Best demo: client `arun.krishnan@ceconline.edu`, provider `arjun.kumar@ceconline.edu`.

## Troubleshooting

- **Port in use** (8000/3000/5432): close the other program, or stop any local Postgres if using Docker.
- **Images not showing** in portfolios: needs internet (images load from Unsplash).
- **Login says wrong password right after seeding**: login rate limit is 10/min - wait a minute.
- **Reset demo data any time**: `python seed_all.py` (or `docker compose exec app python seed_all.py`).
