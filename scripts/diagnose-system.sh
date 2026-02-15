#!/bin/bash

# Database & System Diagnostic Script
# Vytvořeno: 2026-02-15
# Účel: Kompletní diagnostika PostgreSQL, SQLite, a systémových prostředků

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  AgentVerse - Diagnostika Databáze a Systému"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Barvy pro výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ============================================================================
print_header "1. SYSTEMOVÉ PROSTŘEDKY"
# ============================================================================

echo ""
echo "📊 Diskový Prostor:"
df -h / | tail -1 | awk '{
    printf "  Root:     %s / %s (%.0f%% používáno, %s volné)\n", $3, $2, $5, $4
}'

echo ""
echo "🧠 Paměť (RAM):"
free -h | tail -2 | awk '
NR==1 {
    printf "  Celkem:   %s\n", $2
    printf "  Použito:  %s\n", $3
    printf "  Volné:    %s\n", $4
    printf "  Dostupné: %s\n", $7
}
'

echo ""
echo "⚙️ Procesor:"
nproc > /dev/null 2>&1 && echo "  Jádra: $(nproc)" || echo "  Jádra: neznámý"

# ============================================================================
print_header "2. DISKOVÝ PROSTOR PROJEKTU"
# ============================================================================

echo ""
echo "📁 Velikost adresářů:"
du -sh .git 2>/dev/null && echo "  .git:" && du -sh .git || echo "  .git: nedostupný"
du -sh node_modules 2>/dev/null && echo "  node_modules:" && du -sh node_modules || echo "  node_modules: nedostupný"
du -sh .next 2>/dev/null && echo "  .next:" && du -sh .next || echo "  .next: nedostupný"
du -sh dev.db 2>/dev/null && echo "  dev.db (SQLite):" && du -sh dev.db || echo "  dev.db: neexistuje"

echo ""
echo "📊 Celková velikost projektu:"
du -sh . 2>/dev/null | awk '{print "  " $1}'

# ============================================================================
print_header "3. DOCKER & KONTEJNERY"
# ============================================================================

echo ""
echo "🐳 Docker Stav:"
if command -v docker &> /dev/null; then
    print_status 0 "Docker je nainstalován"
    docker --version

    echo ""
    echo "Docker daemon status:"
    if docker ps > /dev/null 2>&1; then
        print_status 0 "Docker daemon běží"

        echo ""
        echo "Běžící kontejnery:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "  (žádné)"

        echo ""
        echo "PostgreSQL kontejner:"
        docker inspect agent-verse-db > /dev/null 2>&1 && {
            print_status 0 "Kontejner existuje"
            docker ps --filter "name=agent-verse-db" --format "{{.Status}}"
        } || print_status 1 "Kontejner neexistuje"
    else
        print_status 1 "Docker daemon není spuštěný"
        echo "  Spusťte: sudo systemctl start docker"
    fi
else
    print_status 1 "Docker není nainstalován"
fi

# ============================================================================
print_header "4. DATABASE - SQLITE"
# ============================================================================

echo ""
echo "📦 SQLite (dev.db):"
if [ -f "dev.db" ]; then
    print_status 0 "Soubor existuje"
    ls -lh dev.db | awk '{print "  Velikost: " $5 ", Změněno: " $6 " " $7 " " $8}'

    echo ""
    echo "  Tabulky v SQLite:"
    if command -v sqlite3 &> /dev/null; then
        sqlite3 dev.db ".tables" | sed 's/^/    /'
    else
        print_warning "sqlite3 CLI není dostupná"
    fi
else
    print_status 1 "dev.db neexistuje"
fi

# ============================================================================
print_header "5. DATABASE - PostgreSQL"
# ============================================================================

echo ""
echo "🐘 PostgreSQL Konfigurace:"
echo "  DATABASE_URL=$(grep DATABASE_URL .env 2>/dev/null | cut -d'=' -f2 | sed 's/:.*@/:[HIDDEN]@/')"
echo "  POSTGRES_PORT=$(grep POSTGRES_PORT .env 2>/dev/null | cut -d'=' -f2)"

echo ""
echo "  Status:"
if docker ps --filter "name=agent-verse-db" --format "{{.ID}}" 2>/dev/null | grep -q .; then
    print_status 0 "PostgreSQL kontejner běží"

    echo ""
    echo "  Health Check:"
    docker exec agent-verse-db pg_isready -U agentverse -d agentverse 2>/dev/null && {
        print_status 0 "PostgreSQL je dostupný"
    } || print_status 1 "PostgreSQL není dostupný"
else
    print_status 1 "PostgreSQL kontejner není spuštěný"
    echo "  Spusťte: docker-compose up -d db"
fi

# ============================================================================
print_header "6. GIT REPOSITORY"
# ============================================================================

echo ""
echo "📚 Repository Status:"
if [ -d ".git" ]; then
    print_status 0 "Git repository je inicializován"

    echo ""
    git log -1 --oneline 2>/dev/null | awk '{print "  Poslední commit: " $0}'

    echo ""
    echo "Git Stav:"
    git status --short | wc -l | awk '{
        if ($1 > 0) printf "  Změnit soubory: %d\n", $1
        else printf "  Žádné změnitelné soubory\n"
    }'
else
    print_status 1 "Git repository není inicializován"
fi

# ============================================================================
print_header "7. NODE.JS & NPM"
# ============================================================================

echo ""
echo "🟢 Node.js:"
if command -v node &> /dev/null; then
    print_status 0 "Node.js je nainstalován"
    node --version | awk '{print "  Verze: " $1}'
else
    print_status 1 "Node.js není nainstalován"
fi

echo ""
echo "📦 NPM:"
if command -v npm &> /dev/null; then
    print_status 0 "npm je nainstalován"
    npm --version | awk '{print "  Verze: " $1}'

    echo ""
    echo "  Node moduly:"
    [ -d "node_modules" ] && echo "    ✓ node_modules je nainstalován" || echo "    ✗ node_modules chybí"
else
    print_status 1 "npm není nainstalován"
fi

# ============================================================================
print_header "8. PRISMA STATUS"
# ============================================================================

echo ""
echo "🗄️ Prisma:"
if [ -f "prisma/schema.prisma" ]; then
    print_status 0 "schema.prisma existuje"

    echo ""
    echo "  Konfigurované databáze:"
    grep -A 5 "datasource db" prisma/schema.prisma 2>/dev/null | grep "provider\|url" | sed 's/^/    /'
else
    print_status 1 "schema.prisma neexistuje"
fi

# ============================================================================
print_header "9. BUILD & TEST"
# ============================================================================

echo ""
echo "🏗️ Build Status:"
[ -d ".next" ] && echo "  ✓ Build cache (.next) existuje" || echo "  ✗ Build cache neexistuje"

echo ""
echo "📝 Linting Status:"
if command -v npm &> /dev/null; then
    echo "  Spusťte: npm run lint"
else
    echo "  npm není dostupný"
fi

echo ""
echo "🧪 Test Status:"
if command -v npm &> /dev/null; then
    echo "  Spusťte: npm run test"
else
    echo "  npm není dostupný"
fi

# ============================================================================
print_header "10. ENVIRONMENT VARIABLES"
# ============================================================================

echo ""
echo "📋 .env Kontrola:"
if [ -f ".env" ]; then
    print_status 0 ".env soubor existuje"

    echo ""
    echo "  Nastavené proměnné:"
    grep -E "^[A-Z_]+" .env | wc -l | awk '{print "    Počet: " $1}'

    echo ""
    echo "  Kritické proměnné:"
    for var in "PORT" "DATABASE_URL" "POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB" "ANTHROPIC_API_KEY" "NEXTAUTH_SECRET"; do
        if grep -q "^$var=" .env; then
            echo "    ✓ $var je nastaven"
        else
            echo "    ✗ $var chybí"
        fi
    done
else
    print_status 1 ".env soubor neexistuje"
    echo "  Zkopírujte: cp .env.example .env"
fi

# ============================================================================
print_header "11. SHRNUTÍ & DOPORUČENÍ"
# ============================================================================

echo ""
echo "🎯 Kontrolní Seznam:"
echo ""

# Docker check
if docker ps > /dev/null 2>&1; then
    echo "  ${GREEN}✓${NC} Docker běží"
else
    echo "  ${RED}✗${NC} Docker není spuštěný - spusťte: systemctl start docker"
fi

# PostgreSQL check
if docker ps --filter "name=agent-verse-db" --format "{{.ID}}" 2>/dev/null | grep -q .; then
    echo "  ${GREEN}✓${NC} PostgreSQL běží"
else
    echo "  ${RED}✗${NC} PostgreSQL neběží - spusťte: docker-compose up -d db"
fi

# Node modules check
if [ -d "node_modules" ]; then
    echo "  ${GREEN}✓${NC} Node moduly jsou nainstalované"
else
    echo "  ${RED}✗${NC} Node moduly chybí - spusťte: npm install"
fi

# Database file check
if [ -f "dev.db" ]; then
    echo "  ${GREEN}✓${NC} SQLite je dostupný (dev.db)"
else
    echo "  ${YELLOW}⚠${NC} SQLite chybí - bude vytvořen Prisma migrací"
fi

echo ""
echo "🔧 Doporučené Kroky:"
echo "  1. Ověřit Docker:     docker ps"
echo "  2. Spustit PostgreSQL: docker-compose up -d"
echo "  3. Instalovat deps:    npm install"
echo "  4. Spustit migraci:    npx prisma migrate deploy"
echo "  5. Spustit app:        npm run dev"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Diagnostika dokončena - $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════════"
