# DigitLab Docker Desktop & GitHub Automation Guide

## 1. Overview (Project Architecture)

DigitLab project ko **Docker Desktop** par run karne aur **GitHub Commits** ke saath automatically update karne ke liye complete setup taiyar ho gaya hai:

| Service | Technology | Port (Localhost) | Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | Angular + Nginx | `http://localhost` & `http://localhost:4200` | UI, SPA routing, API proxying |
| **Backend** | ASP.NET Core 10 Web API | `http://localhost:5000` (Swagger: `/swagger`) | Business logic, JWT auth, PDF reports |
| **Database** | SQL Server / SQLite | Local / Host / Cloud | Auto-migrated via EF Core & DbInitializer |
| **Watchtower** | Container Auto-updater | Background | Detects new GitHub commits & updates containers |

---

## 2. Docker Desktop me Local Run Karne Ka Tarika (Step-by-Step)

### Step 1: Docker Desktop Open Karein
Windows taskbar ya desktop se **Docker Desktop** open karein (status "Engine running" hona chahiye).

### Step 2: One-Click Start
Project folder me `docker-start.bat` ko double-click karein:
- Yeh check karega ki Docker running hai ya nahi
- Backend aur Frontend build karega
- Containers launch karke browser me `http://localhost` open kar dega!

Ya command line se:
```bash
docker compose up -d --build
```

---

## 3. Database Local Configuration (`.env`)

Aap `.env` file me database asani se change kar sakte hain:

### Option A: Pre-configured Cloud Database (Recommended for quick test)
```ini
DATABASE_PROVIDER=SqlServer
SQLSERVER_CONNECTION_STRING=Server=db72843.databaseasp.net;Database=db72843;User Id=db72843;Password=Ss5-8P_w#2eK;Encrypt=False;TrustServerCertificate=True;MultipleActiveResultSets=true;
```

### Option B: Zero-Setup Local SQLite Database
Agar aapko bina kisi SQL Server setup ke instant offline test karna hai:
```ini
DATABASE_PROVIDER=Sqlite
SQLITE_CONNECTION_STRING=Data Source=/app/data/lab_lims.db
```

### Option C: Windows Host par chal rahe Local SQL Server se connect karna
Agar aapke Windows PC par SQL Server chal raha hai:
```ini
DATABASE_PROVIDER=SqlServer
SQLSERVER_CONNECTION_STRING=Server=host.docker.internal,1433;Database=LabLimsDb;User Id=sa;Password=YourPassword;Encrypt=False;TrustServerCertificate=True;MultipleActiveResultSets=true;
```

### Option D: Docker ke andar hi Local SQL Server container chalana
Agar aap chahte hain ki SQL Server bhi Docker container me chale:
```bash
docker compose --profile mssql up -d
```

---

## 4. GitHub Automation ("Jo bhi commit ho, Docker Desktop auto work kare")

Aapka requirement tha ki jab bhi commit ho, Docker Desktop automatically GitHub se chale:

### Method A: One-Click Sync & Run (`docker-sync-from-github.bat`)
Jab bhi aap ya koi aur GitHub par naya commit push kare:
1. `docker-sync-from-github.bat` par double-click karein.
2. Yeh GitHub (`origin/main`) se latest code pull karega.
3. Aur Docker containers ko latest commit ke saath restart kar dega!

### Method B: Fully Automated CI/CD (GitHub Actions + GHCR + Watchtower)
- Humne `.github/workflows/docker-build-push.yml` workflow setup kiya hai.
- Jab bhi aap `push_to_github.bat` run karte hain ya `main` branch me commit push hota hai:
  1. GitHub Actions automatically Docker images build karke **GitHub Container Registry (GHCR)** par push karta hai.
  2. `docker-compose.ghcr.yml` me **Watchtower** service included hai jo har 60 seconds me check karti hai aur naye commit aane par **Docker Desktop me containers ko bina kisi command ke auto-restart kar deti hai**!

### Changes Push Karne ke liye:
Folder me `push_to_github.bat` run karein:
- Yeh commit message mangega
- Automatically git commit karega
- GitHub par push karega aur Docker CI/CD trigger ho jayega!

---

## 5. Production Upload Step (Jab Local Testing Complete Ho Jaye)

Local Docker Desktop par pura test aur verify hone ke baad, production par upload karne ke liye:

1. `publish_production.bat` run karein.
2. Yeh production-optimized frontend aur backend build karke `digitlab_production_package.zip` bana dega.
3. Is zip file ko apne production server (MonsterASP.NET, SmarterASP.NET, ya Linux VPS) par upload aur extract kar dein.

---

## 6. Useful Commands Quick Reference

| Action | Command / Batch File |
| :--- | :--- |
| **Start Project** | `docker-start.bat` ya `docker compose up -d` |
| **Stop Project** | `docker-stop.bat` ya `docker compose down` |
| **Pull from GitHub & Rebuild** | `docker-sync-from-github.bat` |
| **Check Container Logs** | `docker compose logs -f` |
| **Backend Logs Only** | `docker compose logs -f backend` |
| **Frontend Logs Only** | `docker compose logs -f frontend` |
| **Commit & Push to GitHub** | `push_to_github.bat` |
