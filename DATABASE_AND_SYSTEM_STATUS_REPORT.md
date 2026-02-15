# Database & System Status Report
**Datum:** 2026-02-15 (aktuální)
**Generováno:** Automaticky
**Status:** ⚠️ VYŽADUJE POZORNOST

---

## 📊 Souhrn Stavu

| Komponenta | Status | Poznámka |
|-----------|--------|----------|
| **PostgreSQL** | ❌ NEBĚŽÍ | Není spuštěný (Docker kontejner není dostupný) |
| **Aplikace** | ❌ NEBĚŽÍ | Next.js aplikace není spuštěná |
| **SQLite (dev.db)** | ✅ DOSTUPNÝ | Lokální SQLite pro vývoj je dostupný |
| **Diskové místo** | ⚠️ OMEZENO | Vidět detaily níže |
| **RAM paměť** | ✅ DOSTUPNÁ | 2.5 GB volné paměti |
| **Git repo** | ✅ INICIALIZOVÁN | Repository je nastaven |

---

## 🖥️ SYSTEMOVÉ PROSTŘEDKY

### Diskový Prostor
```
Filesystem      Size    Used   Avail  Use%  Mounted on
(Pro root partition)
```

**Status:** ⚠️ Částečně dostupný
- Workspace pracovní directory: `/workspace/instances/0`
- Projekt je uložen v git repo: 4.9 MB (.git)
- Node.js moduly: 1.2 GB (node_modules)
- Build cache: 100 MB (.next directory)
- Celkový obsah: ~1.3 GB

**Závěr:** Diskové místo je dostupné, ale projekt je relativně velký.

### Operační Paměť (RAM)
```
Total:     3.7 GB
Používáno: 1.2 GB (32%)
Volné:     669 MB (18%)
Cache:     2.2 GB (60%)
Dostupné:  2.5 GB
```

**Status:** ✅ DOSTATEČNÉ
- Pro běh Node.js + PostgreSQL je 2.5 GB volné paměti dostačující
- Aktuální zatížení je nízké

---

## 🐘 PostgreSQL STATUS

### Aktuální Stav
**Status:** ❌ NEBĚŽÍ

```
Docker dostupnost: ❌ Nedostupný
  - Docker server není spuštěný
  - Kontejnery nejsou spuštěné
  - PostgreSQL kontejner (agent-verse-db) - OFFLINE
```

### Konfigurace
```yaml
PostgreSQL verze: 16-alpine
Kontejner:        agent-verse-db
Port:             5433 (mapovaný z 5432)
Uživatel:         agentverse
Databáze:         agentverse
```

### Nastavení z `.env`
```
DATABASE_URL=postgresql://agentverse:agentverse_password@localhost:5433/agentverse?schema=public
POSTGRES_USER=agentverse
POSTGRES_PASSWORD=agentverse_password
POSTGRES_DB=agentverse
POSTGRES_PORT=5433
```

### Health Check Konfigurace
```bash
Test:       pg_isready -U agentverse -d agentverse
Interval:   10 sekund
Timeout:    5 sekund
Retries:    5
Start wait: 10 sekund
```

### Volný Prostor na Disku (PostgreSQL)
- PostgreSQL data volume: `postgres-data` (Docker managed)
- **Status:** ❌ Nedostupný (Docker neběží)
- **Připraveno:** Při startu Docker se vytvoří automaticky

---

## 📦 DATABÁZÍ KONFIGURACE

### Aktuální Databáze
**Primární:** SQLite (dev.db)
```
Typ:      SQLite
Soubor:   ./dev.db
ORM:      Prisma v7.4.0
Adapter:  @prisma/adapter-libsql
```

**Status:** ✅ FUNKČNÍ (pro vývoj)

### Tabulky & Schéma
**Počet tabulek:** 12
**Migrace:** 5 aplikovaných
**Stav:** ✅ Všechny tabulky existují

Viz `DATABASE_STATUS.md` pro detaily.

---

## 🚀 NASAZENÍ A LOGY

### Poslední Deployment Status
**Workflow #66:** ❌ SSH TIMEOUT (102 sekund)

```
Datum:       2026-02-15
Příčina:     SSH connection timeout
Problém:     Nejspíše chybějící GitHub Secrets
             (SERVER_HOST, SERVER_USER, SERVER_SSH_KEY)
```

### Poslední Úspěšné Deploy
- Neznámo - poslední pokusy selhaly
- Databáze je konfigurována (Prisma fixace z 2026-02-14)
- ESLint chyby stále přítomny (72 chyb)

### Logy Dostupné
Najdete v následujících souborech:
1. `DEPLOYMENT_WORKFLOW_66_SSH_FAILURE_ANALYSIS.md` (595 řádků)
2. `DEPLOYMENT_ANALYSIS_INDEX.md` (455 řádků)
3. `docs/WORKFLOW_66_DEPLOYMENT_SUMMARY.md`
4. `docs/DEPLOYMENT_HISTORY_AND_FAILURES.md` (470 řádků)

### Git Commit Historie
```bash
d74b309  Merge #75 - Docker transitive deps verification
a15b695  docs: Docker transitive deps
da6eea3  docs: Prisma 7 transitive deps
ea97525  Merge #74 - Workflow #75 deployment failure
e74acb4  docs: Workflow #75 failure analysis
d74a73f  fix: ESLint errors blocking deployment
86f73c7  feat: Tailwind color scheme
b5851b9  refactor: SQLite → PostgreSQL migration
```

---

## ⚠️ IDENTIFIKOVANÉ PROBLÉMY

### Kritické (Blokují Deployment)
1. **Docker nedostupný**
   - Status: ❌
   - Impact: Nelze spustit PostgreSQL ani aplikaci
   - Řešení: Spustit Docker daemon

2. **GitHub Secrets chybí**
   - Status: ❌ (předpokládáme)
   - Impact: SSH deployment nemůže připojit se k serveru
   - Řešení: Konfigurovat GitHub Secrets

3. **ESLint chyby v kódu**
   - Status: ❌
   - Počet: 72 chyb
   - Impact: Docker build by selhal
   - Řešení: Spravit ESLint violations

### Varování (Ovlivňují Provoz)
1. **Lint checks jsou vypnuté**
   - Status: ⚠️
   - Impact: Špatný kód se může dostat do main
   - Řešení: Obnovit lint checks v PR workflow

2. **Databáze není spuštěná**
   - Status: ⚠️
   - Impact: Nelze testovat s live DB
   - Řešení: `docker-compose up` (pokud je Docker dostupný)

---

## 📋 KONTROLNÍ SEZNAM - CO JE POTŘEBA UDĚLAT

### Ihned (Aby Fungovalo Lokálně)
- [ ] Ověřit, že Docker je nainstalován: `docker --version`
- [ ] Spustit Docker daemon
- [ ] Zkontrolovat `.env` soubor (je nastaven správně)
- [ ] Spustit `docker-compose up` pro PostgreSQL
- [ ] Ověřit, že PostgreSQL je dostupný na `localhost:5433`

### Pro Deployment (Aby Pracovalo na Produkci)
- [ ] Jít na GitHub Settings → Secrets → Actions
- [ ] Přidat `SERVER_HOST` (IP/doména serveru)
- [ ] Přidat `SERVER_USER` (SSH uživatel)
- [ ] Přidat `SERVER_SSH_KEY` (privátní SSH klíč)
- [ ] Ověřit `SERVER_SSH_PORT` (výchozí 22)

### Kód (Aby Prošel Build)
- [ ] Spravit 72 ESLint chyb
- [ ] Spustit `npm run lint` bez chyb
- [ ] Spustit `npm run test` bez chyb
- [ ] Spustit `npm run build` bez chyb

---

## 🔍 DIAGNOSTICKÉ PŘÍKAZY

### PostgreSQL Diagnostika
```bash
# Zkontrolovat, zda Docker běží
docker ps

# Spustit PostgreSQL
docker-compose up -d db

# Ověřit PostgreSQL health
docker compose ps
docker compose logs db

# Připojit se k PostgreSQL
psql postgresql://agentverse:agentverse_password@localhost:5433/agentverse

# Zkontrolovat volné místo v databázi (v SQL)
SELECT
  datname,
  pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database;
```

### Lokální Databází Diagnostika
```bash
# Ověřit SQLite existuje
ls -lh dev.db

# Zkontrolovat tabulky
npx prisma db pull

# Zkontrolovat status migrací
npx prisma migrate status

# Spustit seed data
npm run db:seed
```

### Systemové Diagnostiky
```bash
# Diskové místo
df -h

# Paměť
free -h

# Procesy
ps aux | grep -E 'postgres|docker|node'

# CPU
top -bn1 | head -20
```

---

## 📈 DOPORUČENÉ AKCE

### Priorita 1 (NYNÍ)
1. Spustit Docker a PostgreSQL
2. Ověřit konektivitu k databázi
3. Spustit testy: `npm run test && npm run lint`

### Priorita 2 (DNES)
1. Spravit ESLint violations (72 chyb)
2. Zkonfigurovat GitHub Secrets pro deployment
3. Testovat SSH connectivity na produkční server

### Priorita 3 (TENTO TÝDEN)
1. Nastavit monitoring PostgreSQL
2. Implementovat backup strategie
3. Testovat scalability s větší zátěží

---

## 📞 REFERENCE DOKUMENTACE

Pro více informací, viz:
- `DATABASE_STATUS.md` - Detailní stav databáze
- `DEPLOYMENT_ANALYSIS_INDEX.md` - Kompletní deployment analýza
- `docs/GITHUB_ACTIONS_WORKFLOW_REFERENCE.md` - GitHub Actions reference
- `docs/DEPLOYMENT_HISTORY_AND_FAILURES.md` - Historie deploymentů

---

## 📝 POZNÁMKY

### Aktuální Prostředí
- **Lokace:** /workspace/instances/0/agent-verse-via-agent
- **Git:** Konfigurován, připraven
- **Node.js:** Nainstalován (npm dostupný)
- **Docker:** ❌ Nedostupný v aktuální chvíli
- **Databáze:** SQLite funkční, PostgreSQL offline

### Posledních Změn
- Prisma 7 databázové fixace (2026-02-14) - ✅ HOTOVO
- SQLite → PostgreSQL migrace - ✅ HOTOVO (ale netest. na živo)
- Color scheme aktualizace - ✅ HOTOVO
- ESLint chyby - ❌ ZBÝVÁ 72 chyb

---

**Poslední aktualizace:** 2026-02-15
**Stav Reportu:** Aktuální
