# 🔍 Current System Status Report
**Datum vytvoření:** 2026-02-15 21:02:10
**Diagnostika:** Kompletní
**Stav:** ⚠️ VYŽADUJE POZORNOST

---

## 🚨 EXECUTIVE SUMMARY

| Komponenta | Status | Priority | Action |
|-----------|--------|----------|--------|
| **PostgreSQL** | ❌ OFFLINE | 🔴 HIGH | Docker není nainstalován |
| **SQLite** | ❌ NEEXISTUJE | 🟡 MEDIUM | Bude vytvořen Prisma migrací |
| **Diskové místo** | ⚠️ KRITICKÉ | 🔴 HIGH | 97% zaplneno (jen 1.3GB volné) |
| **Docker** | ❌ CHYBÍ | 🔴 HIGH | Musí být nainstalován |
| **Node.js/npm** | ✅ OK | 🟢 LOW | v22.22.0 / v10.9.4 |
| **Git repo** | ✅ OK | 🟢 LOW | Inicializován, 2 změny |
| **Paměť (RAM)** | ✅ OK | 🟢 LOW | 2.4GB dostupné |
| **Prisma** | ⚠️ OFFLINE | 🟡 MEDIUM | Konfigurován, PostgreSQL není dostupný |

---

## 📊 SYSTEMOVÉ PROSTŘEDKY - DETAILNĚ

### Diskový Prostor (KRITICKÉ) 🚨
```
Root partition:  38GB total
Používáno:       35GB (97%) ← ⚠️ KRITICKÉ
Volné:           1.3GB (3%)  ← ⚠️ KRITICKÉ
```

**Impact:**
- ❌ Nelze stahovat velké závislosti
- ❌ Docker nespustí se (potřebuje prostor)
- ❌ PostgreSQL nebude mít prostor pro data
- ⚠️ Build procesu se nemusí vejít do paměti

**Co zabírá místo:**
- `.next` build cache: 100 MB
- `node_modules`: 1.2 GB
- `.git` repository: 4.9 MB
- **Zbytek systému: ~35 GB**

**Doporučení:**
1. **Ihned:** Zkontrolovat `/var` a `/home` obsah
2. **Urychleně:** Vyčistit staré logy,Cache, temp soubory
3. **Potřebné volné místo:** Min. 5GB pro Docker + DB operations

### Operační Paměť (OK) 🟢
```
Celkem:    3.7 GB
Používáno: 1.4 GB (38%)
Volné:     459 MB (12%)
Dostupné:  2.4 GB (65%)
```

**Status:** ✅ DOSTATEČNÉ
- Pro Node.js + PostgreSQL je dostačující
- Není kritické

### CPU (OK) 🟢
```
Jádra: 2
```

---

## 🐘 DATABASE STATUS

### PostgreSQL - OFFLINE ❌

**Konfigurace:**
```yaml
Verze:      PostgreSQL 16 (Alpine Linux image)
Host:       localhost
Port:       5433 (externe), 5432 (kontejner)
Uživatel:   agentverse
Heslo:      agentverse_password
Databáze:   agentverse
```

**Problém:** Docker není nainstalován
```bash
❌ Docker command: docker
❌ docker-compose command
❌ Kontejnery nemůžou běžet
```

**Co je potřeba:**
1. Instalace Docker: https://docs.docker.com/install/
2. Spuštění: `docker-compose up -d db`
3. Ověření: `docker ps` + `psql` connection test

**Health Check Konfigurace:**
```bash
Příkaz:   pg_isready -U agentverse -d agentverse
Interval: 10 sekund
Timeout:  5 sekund
Retries:  5 pokusů
Start:    10 sekund čekání
```

### SQLite (dev.db) - NEEXISTUJE ⚠️

**Stav:**
```
Soubor: ./dev.db
Status: ❌ Neexistuje
```

**Poznámka:** Bude vytvořen automaticky při spuštění Prisma migrace:
```bash
npx prisma migrate deploy
```

---

## 🐳 DOCKER & KONTEJNERY

### Status: Docker není nainstalován ❌

```bash
$ docker --version
bash: docker: command not found
```

### Kontejnery konfigurace (docker-compose.yml):
```yaml
Services:
  db:
    Image:     postgres:16-alpine
    Container: agent-verse-db
    Port:      5433:5432
    Volume:    postgres-data
    Network:   agent-verse-network

  app:
    Build:     Dockerfile (Node.js)
    Container: agent-verse-app
    Port:      3000:3000
    Depends:   db (healthy)
    Network:   agent-verse-network
```

### Co je potřeba udělat:
1. **Instalace Docker:** `curl -fsSL https://get.docker.com | sh`
2. **Instalace Docker Compose:** `apt-get install docker-compose` (nebo novější `docker compose`)
3. **Start:** `docker-compose up -d`
4. **Ověření:** `docker ps`, `docker logs agent-verse-db`

---

## 📦 GIT REPOSITORY

**Status:** ✅ Inicializován

```
Umístění:    /workspace/instances/0/agent-verse-via-agent
Velikost:    4.9 MB
Stavy:       2 soubory s změnami
```

**Poslední commits:**
```
d74b309  Merge #75 - Docker transitive dependencies verification
a15b695  docs: Docker transitive dependencies
da6eea3  docs: Prisma 7 transitive dependencies
ea97525  Merge #74 - Workflow #75 deployment failure
e74acb4  docs: Workflow #75 failure analysis
d74a73f  fix: ESLint errors blocking deployment
```

**Co se změnilo:**
1. `DATABASE_AND_SYSTEM_STATUS_REPORT.md` (nový soubor)
2. `scripts/diagnose-system.sh` (nový soubor)

---

## 🟢 NODE.JS & NPM

**Status:** ✅ Instalováno a funkční

```bash
Node.js: v22.22.0
npm:     v10.9.4
```

**Dependence:**
```
node_modules:     ✅ Nainstalován (1.2GB)
package.json:     ✅ Existuje
package-lock.json: ✅ Existuje
```

---

## 🗄️ PRISMA STATUS

**Status:** ✅ Konfigurován (ale database offline)

```
Schema:     prisma/schema.prisma ✅
Config:     prisma.config.ts ✅
Provider:   postgresql ✅
Adapter:    @prisma/adapter-libsql ✅
ORM Version: Prisma v7.4.0 ✅
```

**Migrace:**
```
Status:     5 migracích aplikováno (SQLite verze)
Migrate:    Pending (PostgreSQL není dostupný)
```

**Potřebné příkazy:**
```bash
# Ověřit migrace status
npx prisma migrate status

# Spustit migrace (až bude PostgreSQL dostupný)
npx prisma migrate deploy

# Vygenerovat Prisma Client
npx prisma generate

# Seed data (pokud je potřeba)
npm run db:seed
```

---

## 🏗️ BUILD & LINT STATUS

### Build Status
```
.next cache:   ✅ Existuje (100MB)
Last build:    ✅ Existuje
```

### ESLint Status
```
Chyby:  ❌ 72 ESLint violations (známo z deployment logů)
Stav:   ❌ Lint checks vypnuty v PR workflow
```

**Doporučení:**
```bash
# Zkontrolovat ESLint chyby
npm run lint

# Opravit automaticky (pokud je možné)
npm run lint -- --fix

# Spustit testy
npm run test

# Plný build
npm run build
```

---

## 📋 ENVIRONMENT VARIABLES

**Status:** ✅ Nakonfigurováno

```bash
PORT=3000                                              ✅
DATABASE_URL=postgresql://...@localhost:5433/...      ✅
POSTGRES_USER=agentverse                              ✅
POSTGRES_PASSWORD=agentverse_password                 ✅
POSTGRES_DB=agentverse                                ✅
POSTGRES_PORT=5433                                    ✅
ANTHROPIC_API_KEY=test_key_for_build                  ✅
NEXTAUTH_SECRET=test_secret_for_build_...             ✅
NEXTAUTH_URL=http://localhost:3000                    ✅
```

**Poznámka:** `ANTHROPIC_API_KEY` je "test_key" - bude potřeba skutečný klíč pro produkci.

---

## 🚀 DEPLOYMENT STATUS

### Poslední Deployment
```
Workflow:  #75 (Merge PR #75)
Status:    Počítáme se statusem...
```

### Známé Problémy (ze starších logů)
```
Workflow #66:  ❌ SSH timeout (102 sekund)
               → GitHub Secrets chybí (SERVER_HOST, SERVER_USER, SERVER_SSH_KEY)

Workflow #63:  ❌ Color scheme failure
               → Opraveno v commit 86f73c7

Workflow #62:  ❌ Docker build failure
               → Opraveno v commit d74a73f
```

---

## ⚠️ BLOKUJÍCÍ PROBLÉMY

### 🔴 KRITICKÉ (Blokují veškeré operace)

#### 1. Diskový Prostor - KRITICKÉ (97% ZAPLNĚNO)
```
Dostupné: 1.3 GB
Potřebné: Min. 5 GB pro Docker + DB
Status:   ❌ KRITICKÉ
```
**Řešení:**
- Vyčistit `/var/log`, `/tmp`, cache
- Smazat staré Docker images: `docker image prune`
- Smazat staré balíčky: `apt-get autoremove`

#### 2. Docker - CHYBÍ
```
Instalován: ❌ Ne
Potřebný:   ✅ Ano (pro PostgreSQL & production)
```
**Řešení:**
- Instalace Docker: https://docs.docker.com/install/
- Ověřit: `docker --version`

### 🟡 VYSOKÉ PRIORITY

#### 1. ESLint Violations
```
Počet: 72 chyb
Impact: Docker build selhá, deployment zablokován
```
**Řešení:**
```bash
npm run lint --fix  # Automatické opravy
npm run test        # Ověření
```

#### 2. GitHub Secrets - Deployment
```
Chybí:  SERVER_HOST, SERVER_USER, SERVER_SSH_KEY
Impact: SSH deployment neúspěšný
```
**Řešení:**
- GitHub Settings → Secrets → Actions
- Přidat 4 secrets s produkčním serverem

---

## 📝 DIAGNOSTICKÉ PŘÍKAZY

### Diskový Prostor
```bash
# Kontrola diskového místa
df -h

# Celkové využití
du -sh /*

# Najít velké soubory
find / -type f -size +100M 2>/dev/null | head -20
```

### Docker Diagnostika
```bash
# Instalace
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Verze
docker --version
docker-compose --version

# Status
docker ps
docker images
docker logs agent-verse-db
```

### PostgreSQL Diagnostika
```bash
# Spustit kontejner
docker-compose up -d db

# Health check
docker-compose ps
docker compose logs db

# Připojit se
psql postgresql://agentverse:agentverse_password@localhost:5433/agentverse

# SQL příkazy (v psql):
\dt              # Zobrazit tabulky
\l               # Zobrazit databáze
SELECT version(); # Verze PostgreSQL
```

### Prisma Diagnostika
```bash
# Migrace status
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Database pull (introspect)
npx prisma db pull

# Studio (GUI editor)
npx prisma studio
```

### Build & Testing
```bash
# Lint
npm run lint
npm run lint -- --fix

# Test
npm run test

# Build
npm run build

# Development
npm run dev
```

---

## 🎯 ACTION PLAN (Krokový plán)

### FÁZE 1: Okamžitě (do 1 hodiny)
- [ ] **Diskový prostor:** Vyčistit min. 3GB
  - `sudo apt-get autoremove && sudo apt-get autoclean`
  - Smazat `/var/log` staré logy
  - `docker image prune -a` (pokud Docker je)

- [ ] **Docker instalace:**
  - `curl -fsSL https://get.docker.com | sh`
  - `sudo usermod -aG docker $USER`
  - Ověřit: `docker --version`

- [ ] **Spustit PostgreSQL:**
  - `docker-compose up -d db`
  - `docker ps` (ověřit agent-verse-db běží)

### FÁZE 2: Dnes (2-4 hodiny)
- [ ] **ESLint chyby:**
  - `npm run lint` (zjistit chyby)
  - `npm run lint -- --fix` (opravit)
  - Commitnout změny

- [ ] **Prisma migrace:**
  - `npx prisma migrate status` (ověřit status)
  - `npx prisma migrate deploy` (spustit)
  - `npx prisma studio` (ověřit data)

- [ ] **Testy & Build:**
  - `npm run test` (spustit testy)
  - `npm run build` (build check)

### FÁZE 3: Týden (Production Ready)
- [ ] **GitHub Secrets:**
  - Konfigurovat SERVER_HOST, SERVER_USER, SERVER_SSH_KEY
  - Test SSH connectivity

- [ ] **Monitoring:**
  - Nastavit disk space alerts
  - PostgreSQL query monitoring

- [ ] **Backup:**
  - Nastavit PostgreSQL backups
  - Database snapshots

---

## 📚 REFERENCE DOKUMENTY

```
DATABASE_STATUS.md                              - Databází status (SQLite, Prisma)
DATABASE_AND_SYSTEM_STATUS_REPORT.md           - Tento report
DEPLOYMENT_ANALYSIS_INDEX.md                   - Deployment failure analysis
DEPLOYMENT_WORKFLOW_66_SSH_FAILURE_ANALYSIS.md - SSH timeout analysis
docs/GITHUB_ACTIONS_WORKFLOW_REFERENCE.md      - GitHub Actions reference
docs/DEPLOYMENT_HISTORY_AND_FAILURES.md        - Deployment history
```

---

## 📞 KLÍČOVÉ INFORMACE

### Konfigurované Port
- **Aplikace:** 3000
- **PostgreSQL:** 5433 (docker host) / 5432 (container)
- **SSH Deploy:** Není konfigurován (await secrets)

### Databázové Soubory
- **SQLite:** `./dev.db` (development, neexistuje)
- **PostgreSQL:** docker volume `postgres-data` (offline)
- **Backups:** Nejsou nakonfigurované

### Build Artefakty
- **Next.js:** `.next` directory (100MB)
- **Node modules:** `node_modules` (1.2GB)
- **Source:** `app/`, `lib/`, `pages/` directories

---

## ✅ CHECKLIST - CO JE HOTOVO

- ✅ Git repository inicializován
- ✅ Node.js & npm instalován
- ✅ .env soubor nakonfigurován
- ✅ Prisma konfigurován
- ✅ Docker Compose nakonfigurován
- ✅ ESLint & Test setupy hotové
- ❌ Docker nainstalován
- ❌ PostgreSQL běžící
- ❌ ESLint chyby opraveny
- ❌ GitHub Secrets nakonfigurované

---

## 📈 METRIKY

```
Projekt Velikost:      1.3 GB
Diskový Prostor Volný: 1.3 GB (KRITICKÉ - 97% zaplneno)
RAM Dostupný:          2.4 GB (OK)
CPU Jádra:             2 (OK)

Node.js:               v22.22.0
npm:                   v10.9.4
Prisma:                v7.4.0
PostgreSQL:            v16-alpine

Git Commits:           75+ commits
ESLint Violations:     72 (PENDING FIX)
```

---

## 🔗 POSLEDNÍ AKTUALIZACE

**Vytvořeno:** 2026-02-15 21:02:10 (pomocí `diagnose-system.sh`)
**Status:** Aktuální
**Příští kontrola:** Doporučeno za 1 týden po opravě kritických problémů

---

## 💡 POZNÁMKY

1. **Diskový prostor je kritický** - je potřeba vyčistit prostor, než se dá cokoliv spustit
2. **Docker musí být nainstalován** - bez něho nelze spustit PostgreSQL
3. **ESLint chyby blokují deployment** - musí být opraveny
4. **PostgreSQL zatím offline** - dev prostředí může používat SQLite
5. **GitHub Secrets nejsou nastaveny** - automatický deployment nefunguje

