# AgentVerse Color System - Index Dokumentace

**Vytvořeno:** 15.2.2026
**Úroveň Hotovosti:** Kompletní & Výrobní
**Auditor:** Claude Code - Technická Analýza

---

## 📑 OBSAH DOKUMENTACE

Tato dokumentace je rozdělena do **4 samostatných souborů**, každý se zaměřuje na jinou perspektivu:

### 1. 📊 **COLOR_SCHEME_ANALYSIS_REPORT.md** (ZAČNĚTE TADY!)
   **Čtenář:** Všichni (PM, Designer, Developer)
   **Obsah:**
   - Přehled barevného systému (barvy, kódy, popis)
   - Jak jsou barvy definovány (CSS variables, Tailwind)
   - Přehled všech komponent a stránek s barvami
   - **SEZNAM VŠECH SOUBORŮ K ÚPRAVĚ** (Přesně to, co jste chtěli!)
   - Dostupné Tailwind barvy
   - Dark mode implementace
   - Detailní přehled tříd s barvami

   **Ideální pro:** Pochopit strukturu, orientaci, plánování
   **Čas čtení:** 15-20 minut

---

### 2. 🎨 **COLOR_CHANGE_GUIDE.md** (PRAKTICKÝ NÁVOD)
   **Čtenář:** Vývojáři, kteří chtějí měnit barvy
   **Obsah:**
   - QUICK START (5 minut na změnu)
   - Detailní instrukce krok za krokem
   - Příklady barevných palet
   - Jak změnit role-based barvy
   - Oprava hardkódovaných barev
   - Přidání nových barev
   - Příklady 4 různých palety
   - Ověření změn
   - Common mistakes & solutions
   - Checklist před commit

   **Ideální pro:** Rychlé implementace, praktické řešení
   **Čas čtení:** 10-15 minut (dle potřeby)

---

### 3. 🔧 **DESIGN_SYSTEM_TECHNICAL_REFERENCE.md** (TECHNICKÁ HLOUBKA)
   **Čtenář:** Senior vývojáři, architekti, tech leads
   **Obsah:**
   - Architecture overview (diagram)
   - File dependency graph
   - **KOMPLETNÍ reference CSS variables** (se všemi linkami)
   - Tailwind configuration deep dive
   - Component color usage matrix
   - Theme implementation detaily
   - Build process & pipeline
   - Testing colors (unit & E2E)
   - Migration guide z předchozích systémů
   - FAQ & troubleshooting

   **Ideální pro:** Porozumění systému, integraci, advanced features
   **Čas čtení:** 20-30 minut

---

### 4. 🎭 **COLOR_SYSTEM_VISUAL_REFERENCE.md** (VIZUÁLNÍ PŘEHLED)
   **Čtenář:** Designeři, UI/UX, vizuální orientace
   **Obsah:**
   - ASCII preview barevné palety
   - Light theme visual layout
   - Dark theme visual layout
   - Component color examples (button, form, card)
   - Status indicators (success, warning, error)
   - Role-based colors vizuálně
   - Gradient examples
   - Hover & interactive states
   - Opacity variations
   - Typography + colors
   - Accessibility & contrast
   - Color blindness simulator info
   - Responsive colors
   - Production checklist

   **Ideální pro:** Vizuální porozumění, design decisions, accessibility
   **Čas čtení:** 10 minut

---

## 🗺️ NAVIGAČNÍ MAPA

```
JSTE NOVÝ V PROJEKTU?
├─ Přečtěte: COLOR_SCHEME_ANALYSIS_REPORT.md (Úvod)
├─ Pak: COLOR_SYSTEM_VISUAL_REFERENCE.md (Vizuál)
└─ Pak: COLOR_CHANGE_GUIDE.md (Praktika)

POTŘEBUJETE ZMĚNIT BARVY HNED?
├─ Jděte na: COLOR_CHANGE_GUIDE.md
├─ Sekce: QUICK START (5 minut)
└─ Hotovo!

POTŘEBUJETE POROZUMĚT ARCHITEKTUŘE?
├─ Přečtěte: COLOR_SCHEME_ANALYSIS_REPORT.md (Sekce 1-7)
├─ Pak: DESIGN_SYSTEM_TECHNICAL_REFERENCE.md (Sekce 1-2)
└─ Pak: DESIGN_SYSTEM_TECHNICAL_REFERENCE.md (Sekce 4-6)

MÁTE TECHNICKOU OTÁZKU?
├─ Hledejte v: DESIGN_SYSTEM_TECHNICAL_REFERENCE.md (Sekce 10 - FAQ)
├─ Nebo: Grep `.md soubory pro keyword
└─ Nebo: Zeptejte se tech leada

DESIGNUJETE NOVÝ FEATURE?
├─ Referenční barvy: COLOR_SYSTEM_VISUAL_REFERENCE.md
├─ Kombinace barev: COLOR_SYSTEM_VISUAL_REFERENCE.md (Sekce 13)
├─ Accessibility: COLOR_SYSTEM_VISUAL_REFERENCE.md (Sekce 11-12)
└─ Tailwind classes: COLOR_SCHEME_ANALYSIS_REPORT.md (Sekce 7)

TESTUJI APLIKACI?
├─ Light/Dark theme: COLOR_SYSTEM_VISUAL_REFERENCE.md
├─ Contrast ratios: COLOR_SYSTEM_VISUAL_REFERENCE.md (Sekce 11)
├─ Color blindness: COLOR_SYSTEM_VISUAL_REFERENCE.md (Sekce 11.2)
└─ Checklist: COLOR_SYSTEM_VISUAL_REFERENCE.md (Sekce 14)
```

---

## 📋 RYCHLÁ REFERENČNÍ TABULKA

| Potřeba | Zdroj | Sekce | Čas |
|---------|--------|---------|-----|
| Barva pro tlačítko | Analysis Report | 1 | 1m |
| Změnit primární barvu | Change Guide | Sekce 2 | 5m |
| Pochopit architektu | Analysis Report | 2 | 5m |
| CSS variable reference | Tech Reference | 3 | 5m |
| Příklady palet | Change Guide | Sekce 6 | 3m |
| Accessibility | Visual Ref | 11 | 5m |
| Dark mode FAQ | Tech Ref | 10 | 3m |
| Build process | Tech Ref | 7 | 5m |
| Role colors | Visual Ref | 6 | 2m |
| Component states | Visual Ref | 8 | 3m |

---

## 🎯 ODPOVĚDI NA VAŠE OTÁZKY

### "Jaké jsou barvy aplikace?"
**Answer:** Analysis Report, Sekce 1

```
Primary: #4f46e5 (Indigo 600)
Secondary: #9333ea (Purple 600)
Accent: #0891b2 (Cyan 700)
Success: #059669 (Green)
Warning: #d97706 (Orange)
Danger: #dc2626 (Red)
Neutral: 10-step scale (50-900)
```

### "Jak se barvy definují?"
**Answer:** Analysis Report, Sekce 2

```
CSS Variables → tailwind.config.ts → @theme directive → Tailwind classes
```

### "Které komponenty obsahují barvy?"
**Answer:** Analysis Report, Sekce 3-4 + PŘÍLOHA A

```
29 souborů s barvami (13 pages + 16 components)
Podrobnější seznam v Analysis Report, Příloha A
```

### "Jaké soubory musím změnit?"
**Answer:** Analysis Report, Sekce 4

```
KRITICKÉ (VŽDY):
- app/globals.css
- tailwind.config.ts

VOLITELNÉ:
- app/components/AgentCard.tsx (role colors)
- app/departments/market-research/page.tsx (role colors)
- app/components/ChatMessage.tsx (REFACTOR - hardkódované!)
```

### "Jak změním barvy?"
**Answer:** Change Guide, Sekce 2 nebo QUICK START

```
1. Otevřete: app/globals.css
2. Najděte: :root { --primary: ... }
3. Změňte: Hex kód na nový
4. Restart: npm run dev
```

### "Jak přidám novou barvu?"
**Answer:** Change Guide, Sekce 5

```
1. Přidejte CSS variable do globals.css
2. Přidejte do tailwind.config.ts
3. Přidejte do @theme direktivy
4. Používejte v komponentách
```

### "Jaké jsou Tailwind barvy?"
**Answer:** Analysis Report, Sekce 5

```
Systémové: primary, secondary, accent, success, warning, danger, neutral
Standard: Všechny Tailwind barvy (blue, red, green, atd.)
```

### "Jak funguje dark mode?"
**Answer:** Analysis Report, Sekce 6 & Tech Reference, Sekce 6

```
@media (prefers-color-scheme: dark) {
  Pouze --background a --foreground se mění
  Všechny ostatní barvy zůstávají stejné
}
```

### "Jak se barvy píší?"
**Answer:** Analysis Report, Sekce 7

```
bg-primary, text-primary, border-primary, hover:bg-primary-dark
```

### "Jaké jsou komponenty s hardkódovanými barvami?"
**Answer:** Analysis Report, Sekce 4.2 & Change Guide, Sekce 4

```
ChatMessage.tsx: bg-blue-600, bg-gray-200 (REFACTOR!)
AgentCard.tsx: Role colors (EXPECTED)
```

---

## 📁 STRUKTURA SOUBORŮ NA DISKU

```
agentverse/
├── COLOR_SCHEME_ANALYSIS_REPORT.md          ← ANALYSIS (Start!)
├── COLOR_CHANGE_GUIDE.md                    ← PRAKTIKA
├── DESIGN_SYSTEM_TECHNICAL_REFERENCE.md     ← TECHNIKA
├── COLOR_SYSTEM_VISUAL_REFERENCE.md         ← VIZUÁL
├── COLOR_SYSTEM_INDEX.md                    ← TENTO SOUBOR
│
├── app/
│   ├── globals.css                          ← CSS VARIABLES ⭐
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── components/
│   │   ├── AgentCard.tsx                    ← Role colors
│   │   ├── AuthForm.tsx
│   │   ├── ChatMessage.tsx                  ← HARDKÓDOVANÉ! 🔴
│   │   ├── CreateAgentModal.tsx
│   │   └── ... (další komponenty)
│   │
│   ├── agents/
│   ├── departments/
│   └── ... (ostatní stránky)
│
├── tailwind.config.ts                       ← TAILWIND CONFIG ⭐
└── ... (ostatní soubory)
```

---

## 🚀 BĚŽNÉ ÚKOLY & JEJICH ŘEŠENÍ

### Úkol 1: Změnit Primární Barvu
**Čas:** 5 minut
**Soubory:** `app/globals.css` (3 řádky)
**Reference:** Change Guide, Sekce 2 → Případ A

```css
/* ZMĚNIT TYTO 3 ŘÁDKY */
--primary: #2563eb;           /* Změna */
--primary-light: #3b82f6;     /* Změna */
--primary-dark: #1d4ed8;      /* Změna */
```

### Úkol 2: Zapnout Dark Mode
**Čas:** 0 minut
**Soubory:** Žádné změny!
**Jak:** OS → Dark mode, automaticky se aktivuje

### Úkol 3: Přidat Novou Barvu
**Čas:** 10 minut
**Soubory:** `app/globals.css`, `tailwind.config.ts`
**Reference:** Change Guide, Sekce 5

```
1. CSS variable
2. Tailwind mapping
3. @theme directive
4. Use it!
```

### Úkol 4: Opravit Hardkódované Barvy
**Čas:** 15 minut
**Soubory:** `app/components/ChatMessage.tsx`
**Reference:** Change Guide, Sekce 4

```
bg-blue-600 → bg-primary
bg-gray-200 → bg-neutral-200
```

### Úkol 5: Testest Accessibility
**Čas:** 20 minut
**Reference:** Visual Reference, Sekce 11-12

```
1. Contrast ratios ✓
2. Dark theme ✓
3. Color blindness ✓
```

### Úkol 6: Ověřit Build
**Čas:** 5 minut
**Command:** `npm run build`
**Reference:** Tech Reference, Sekce 7

```bash
npm run build
→ Checks Tailwind colors ✓
→ Minifies CSS ✓
→ Ready for production ✓
```

---

## 🔍 HLEDÁME NĚCO SPECIFICKÉHO?

### Pro Designery:
- **Jak se barvy kombinují?** → Visual Reference, 13
- **Která je správná barva?** → Analysis Report, 1
- **Jaké mám barvy na volně?** → Analysis Report, 5

### Pro Vývojáře:
- **Jak se barvy píší?** → Analysis Report, 7
- **Jak je změním?** → Change Guide, 2
- **Jak se to builduje?** → Tech Reference, 7

### Pro Tech Leady:
- **Jaká je architektura?** → Tech Reference, 1-2
- **Jaké jsou dependencies?** → Tech Reference, 2
- **Jak to testujeme?** → Tech Reference, 8

### Pro Projektové Manažery:
- **Jaké je to komplexní?** → Analysis Report, 9
- **Jak dlouho to trvá změnit?** → Change Guide, QUICK START
- **Jaká je struktura?** → Analysis Report, 2-4

---

## ✅ CHECKLIST PŘED ZAHÁJENÍM PRÁCE

- [ ] Přečetl jsem COLOR_SCHEME_ANALYSIS_REPORT.md (Sekce 1)
- [ ] Vím, jaké barvy jsou v systému
- [ ] Znám soubory, které obsahují barvy
- [ ] Spuštěn dev server: `npm run dev`
- [ ] Vidím Light & Dark theme
- [ ] Pochopu, jak se barvy definují
- [ ] Jsem připraven na změny!

---

## 📞 TECH SUPPORT

**Mám otázku na...** → **Přečtu si...**

| Otázka | Soubor | Sekce |
|--------|--------|-------|
| Co jsou barvy? | Analysis | 1 |
| Kde jsou barvy? | Analysis | 2-4 |
| Jak je měním? | Change Guide | 2 |
| Jak přidám novou? | Change Guide | 5 |
| Jak funguje dark mode? | Analysis | 6 |
| Jak se píší? | Analysis | 7 |
| Jak se testují? | Tech Ref | 8 |
| Jak se builduje? | Tech Ref | 7 |
| Jaké jsou best practices? | Visual Ref | 13 |
| Jaké jsou accessibility issues? | Visual Ref | 11 |

---

## 🎓 VZDĚLÁVACÍ SEKVENCE

**Pokud nemáte experience s design systémy:**

1. **Den 1:** Přečtěte Analysis Report (Sekce 1-3)
2. **Den 2:** Přečtěte Visual Reference (všechny sekce)
3. **Den 3:** Přečtěte Change Guide (Sekce 1-3)
4. **Den 4:** Udělejte QUICK START cvičení
5. **Den 5:** Přečtěte Tech Reference (Sekce 1-4)
6. **Ready!** Můžete pracovat na barvách ✓

**Pokud máte experience s design systémy:**

1. **Chvíli:** Skimujte Analysis Report
2. **Chvíli:** Podívejte se na Change Guide QUICK START
3. **Ready!** Všechno ostatní je reference ✓

---

## 🎁 BONUS: COMMAND CHEAT SHEET

```bash
# Spustit dev server
npm run dev

# Build pro produkci
npm run build

# Lint kód
npm run lint

# Spustit testy
npm run test

# Spustit E2E testy
npm run test:e2e

# Spustit dev server s fresh DB
npm run predev && npm run dev

# Restart CSS (pokud se nezmění)
npm run dev
# Ctrl+C, pak znovu:
npm run dev
```

---

## 🏆 SHRNUTÍ V JEDNÉ VĚTĚ

**Aplikace AgentVerse používá CSS Variables pro barvy, které jsou mapovány do Tailwindu, takže můžete změnit všechny barvy v jednom místě (app/globals.css) bez úpravy jednotlivých komponent.**

---

## 📊 STATISTIKA DOKUMENTACE

- **Celkový rozsah:** ~80 stran (4 MD soubory)
- **Počet příkladů:** 50+
- **Počet diagramů:** 15+
- **Počet tabulek:** 30+
- **Počet kódových bloků:** 80+
- **Počet vizuálních reprezentací:** 20+

---

## 🔐 VERZE TRACKING

| Datum | Verze | Co je Nového | Status |
|-------|-------|------------|--------|
| 15.2.2026 | 1.0 | Iniciální release | ✓ Production |
| - | - | - | - |

---

## 📝 POZNÁMKA AUTORA

Tato dokumentace byla vytvořena kompletní analýzou kódu AgentVerse aplikace. Zahrnuje:

✓ Přesné hex kódy z app/globals.css
✓ Přesné mappings z tailwind.config.ts
✓ Všechny komponenty s barvami (29 souborů)
✓ Dark mode logika
✓ Accessibility guidelines
✓ Praktické příklady
✓ FAQ & troubleshooting

**Vhodné pro:**
- Onboarding nových dev
- Reference pro design decisions
- Dokumentace pro budoucnost
- Knowledge base pro team

---

**Created:** 15.2.2026
**By:** Claude Code Analysis
**Status:** Complete & Production Ready ✓

---

🎨 **Happy Coloring!** 🎨

*Pro otázky nebo upřesnění se obraťte na technické vedení.*
