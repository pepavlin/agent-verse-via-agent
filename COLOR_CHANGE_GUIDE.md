# Praktický Návod: Jak Změnit Barevné Schéma AgentVerse

---

## QUICK START - 5 MINUT

Pokud chcete **OKAMŽITĚ** změnit barvy bez hlubokého porozumění:

### Krok 1: Otevřete soubor
```
app/globals.css
```

### Krok 2: Najděte CSS Variables
```css
:root {
  /* Light theme - Modern & Professional */
  --background: #fafbfc;
  --foreground: #0d1117;

  /* Primary colors */
  --primary: #4f46e5;           ← Změňte TOTO
  --primary-light: #6366f1;     ← Změňte TOTO
  --primary-dark: #4338ca;      ← Změňte TOTO

  /* ... ostatní barvy ... */
}
```

### Krok 3: Nahraďte Hex Kódy
```
Pokud jste grafik/designer, máte barevný systém?
   ↓ NE  → Skočte na sekci "Barevné Palety"
   ↓ ANO → Okamžitě nahraďte hex kódy
```

### Krok 4: Restart dev serveru
```bash
npm run dev
```

**Hotovo! ✅**

---

## DETAILNĚJŠÍ POKYNY

### Sekce 1: Porozumění Struktuře

#### 1.1 Kde jsou barvy definovány?

```
agentverse/
├── app/
│   ├── globals.css          ← CSS VARIABLES (HLAVNÍ!)
│   └── components/
│       ├── AgentCard.tsx    ← Hardkódované role barvy
│       └── ChatMessage.tsx  ← Hardkódované barvy (oprav!)
├── tailwind.config.ts       ← TAILWIND CONFIG (SEKUNDÁRNÍ!)
└── postcss.config.mjs
```

#### 1.2 Jak Funguje Barevný Systém?

```
1. CSS Variables se definují v globals.css
   :root { --primary: #4f46e5; }

2. Tailwind je nakonfigurován aby je používal
   colors: { primary: 'var(--primary)' }

3. Komponenty používají Tailwind třídy
   className="bg-primary text-white"

4. Výsledek: bg-primary = background-color: #4f46e5
```

**Výhoda:** Chcete změnit barvu? Změňte jen CSS variable!

---

### Sekce 2: Detailní Návod na Změnu

#### Případ A: Změna Primární Barvy (Deep Indigo → Chtějete Novou)

**Příklad:** Chcete Deep Blue místo Indigo

```css
/* PŮVODNĚ */
--primary: #4f46e5;        /* Indigo 600 */
--primary-light: #6366f1;  /* Indigo 500 */
--primary-dark: #4338ca;   /* Indigo 700 */

/* NOVĚ */
--primary: #2563eb;        /* Blue 600 */
--primary-light: #3b82f6;  /* Blue 500 */
--primary-dark: #1d4ed8;   /* Blue 700 */
```

**Efekt:** Všechna tlačítka, primární prvky se změní na modrou!

#### Případ B: Změna Všech Hlavních Barev

```css
:root {
  /* Light theme */
  --background: #fafbfc;        ← Background aplikace
  --foreground: #0d1117;        ← Text barva

  /* PRIMARY - Hlavní barva (tlačítka, hlavní prvky) */
  --primary: #2563eb;           ← ZMĚŇTE
  --primary-light: #3b82f6;     ← ZMĚŇTE
  --primary-dark: #1d4ed8;      ← ZMĚŇTE

  /* SECONDARY - Sekundární barva (creative prvky) */
  --secondary: #8b5cf6;         ← ZMĚŇTE
  --secondary-light: #a78bfa;   ← ZMĚŇTE
  --secondary-dark: #7c3aed;    ← ZMĚŇTE

  /* ACCENT - Zvýraznění (highlight, hover) */
  --accent: #06b6d4;            ← ZMĚŇTE
  --accent-light: #22d3ee;      ← ZMĚŇTE
  --accent-dark: #0891b2;       ← ZMĚŇTE

  /* Semantic - Vždy se zachovávají! */
  --success: #059669;           ✓ Ponechte (zelená = OK)
  --warning: #d97706;           ✓ Ponechte (oranžová = POZOR)
  --danger: #dc2626;            ✓ Ponechte (červená = CHYBA)

  /* Neutral - Šedá škála (NEMĚŇTE obvykle) */
  --neutral-50: #f8fafc;
  /* ... 50-900 ... */
  --neutral-900: #0f172a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f172a;      ← Dark background
    --foreground: #f8fafc;      ← Light text (inverzní)
    /* Primární a sekundární barvy se NEMĚNÍ pro tmavý režim! */
  }
}
```

#### Případ C: Změna Dark Mode Barev

```css
/* PRO TMAVÝ REŽIM - Jen background změní */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #000000;      ← ZMĚŇTE (tmavá barva)
    --foreground: #ffffff;      ← ZMĚŇTE (světlá barva)
  }
}
```

---

### Sekce 3: Změna Role-Based Barev

Agent karty (researchers, strategists, atd.) mají **speciální role barvy**.

#### 3.1 Soubor: `app/components/AgentCard.tsx`

```typescript
const roleColors: Record<string, string> = {
  researcher: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300',
  strategist: 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-300',
  critic: 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300',
  ideator: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-900 dark:text-cyan-300',
  coordinator: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-300',
  executor: 'bg-rose-100 dark:bg-rose-900/30 text-rose-900 dark:text-rose-300'
}
```

**Pokud chcete Změní Role Barvy:**

```typescript
// NOVÝ SYSTÉM
const roleColors: Record<string, string> = {
  researcher: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300',
  strategist: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300',
  // ... atd
}
```

#### 3.2 Stejné Změny v: `app/departments/market-research/page.tsx`

Najděte podobný objekt `colors` a změňte stejně.

---

### Sekce 4: Oprava Hardkódovaných Barev

**Problém:** Некторé komponenty používají hardkódované Tailwind barvy.

#### 4.1 Komponenta: `app/components/ChatMessage.tsx`

**PŮVODNĚ (ŠLÉ!):**
```jsx
className={`max-w-[70%] rounded-lg px-4 py-2 ${
  isUser
    ? 'bg-blue-600 text-white'           ← Hardkódovaná!
    : 'bg-gray-200 text-gray-900'        ← Hardkódovaná!
}`}
```

**NOVĚ (SPRÁVNĚ):**
```jsx
className={`max-w-[70%] rounded-lg px-4 py-2 ${
  isUser
    ? 'bg-primary text-white'            ← Systémová!
    : 'bg-neutral-200 text-neutral-900'  ← Systémová!
}`}
```

---

### Sekce 5: Přidání Nové Barvy

Pokud chcete **přidat novou barvu** (např. `--tertiary`):

#### Krok 1: Přidejte do CSS Variables
```css
/* V app/globals.css, v :root bloku */
--tertiary: #ec4899;        /* Nová barva */
--tertiary-light: #f472b6;
--tertiary-dark: #db2777;
```

#### Krok 2: Přidejte do Dark Mode (pokud potřeba)
```css
/* Pokud chcete jinou dark mode variantu */
@media (prefers-color-scheme: dark) {
  :root {
    /* Background/foreground změnit, ostatní ne */
  }
}
```

#### Krok 3: Přidejte do Tailwind Config
```typescript
/* V tailwind.config.ts */
colors: {
  // ... stávající barvy ...
  tertiary: {
    light: 'var(--tertiary-light)',
    DEFAULT: 'var(--tertiary)',
    dark: 'var(--tertiary-dark)',
  },
}
```

#### Krok 4: Přidejte do @theme
```css
/* V app/globals.css, v @theme bloku */
--color-tertiary: var(--tertiary);
```

**Nyní můžete používat:**
```jsx
className="bg-tertiary text-white hover:bg-tertiary-dark"
```

---

### Sekce 6: Příklady Barevných Palet

Máte mehrá možnost - zde jsou běžné kombinace:

#### PALETA 1: Tech Blue (Doporučuji)
```css
--primary: #2563eb;           /* Blue 600 */
--primary-light: #3b82f6;     /* Blue 500 */
--primary-dark: #1d4ed8;      /* Blue 700 */

--secondary: #8b5cf6;         /* Violet 500 */
--secondary-light: #a78bfa;   /* Violet 400 */
--secondary-dark: #7c3aed;    /* Violet 600 */

--accent: #10b981;            /* Emerald 500 */
--accent-light: #34d399;      /* Emerald 400 */
--accent-dark: #059669;       /* Emerald 600 */
```

#### PALETA 2: Dark Modern
```css
--primary: #6366f1;           /* Indigo 500 (Light theme) */
--primary-light: #818cf8;     /* Indigo 400 */
--primary-dark: #4f46e5;      /* Indigo 600 */

--secondary: #ec4899;         /* Pink 500 */
--secondary-light: #f472b6;   /* Pink 400 */
--secondary-dark: #db2777;    /* Pink 600 */

--accent: #f59e0b;            /* Amber 500 */
--accent-light: #fbbf24;      /* Amber 400 */
--accent-dark: #d97706;       /* Amber 600 */
```

#### PALETA 3: Corporate
```css
--primary: #1e40af;           /* Blue 800 (Tmavý) */
--primary-light: #2563eb;     /* Blue 600 */
--primary-dark: #1e3a8a;      /* Blue 900 */

--secondary: #4b5563;         /* Slate Gray */
--secondary-light: #64748b;   /* Slate 500 */
--secondary-dark: #334155;    /* Slate 700 */

--accent: #0891b2;            /* Cyan 700 */
--accent-light: #06b6d4;      /* Cyan 600 */
--accent-dark: #0e7490;       /* Cyan 800 */
```

#### PALETA 4: Vibrant
```css
--primary: #d946ef;           /* Fuchsia 500 */
--primary-light: #f0abfc;     /* Fuchsia 300 */
--primary-dark: #a21caf;      /* Fuchsia 700 */

--secondary: #06b6d4;         /* Cyan 600 */
--secondary-light: #22d3ee;   /* Cyan 400 */
--secondary-dark: #0891b2;    /* Cyan 700 */

--accent: #eab308;            /* Yellow 500 */
--accent-light: #facc15;      /* Yellow 400 */
--accent-dark: #ca8a04;       /* Yellow 600 */
```

---

## OVĚŘENÍ ZMĚN

### Kontrola 1: Dev Server Běží?
```bash
npm run dev
```
Pokud se chyby, zkontrolujte syntax v globals.css.

### Kontrola 2: Barvy se Změnily?
Otevřete browser: `http://localhost:3000`
- Vidíte nové barvy na tlačítcích? ✓
- Vidíte nové barvy na hoverech? ✓
- Vidíte nové barvy v tváru formulářů? ✓

### Kontrola 3: Dark Mode?
Přepněte OS na tmavý režim:
- Barvy se změnily automaticky? ✓
- Contrast OK? ✓

### Kontrola 4: Build OK?
```bash
npm run build
```
Pokud se chyby v Tailwindu, máte syntax error.

---

## COMMON MISTAKES (Co NEDĚLAT)

### ❌ CHYBA 1: Změna Jen Tailwind Config
```typescript
// ŠPATNĚ: Změníte tailwind.config.ts, ale CSS variables zůstane
colors: {
  primary: '#2563eb',  // ← Hardkódový HEX
}
```
✅ SPRÁVNĚ: Vždy používejte CSS variables:
```typescript
colors: {
  primary: 'var(--primary)',  // ← CSS variable
}
```

### ❌ CHYBA 2: Zapomenutí Dark Mode
```css
/* ŠPATNĚ: Jen light theme */
--primary: #2563eb;

/* Tmavý režim OK? Stejná barva bude na tmavém pozadí - nečitelná! */
```
✅ SPRÁVNĚ: Má svůj dark mode (nebo use stejnou barvu):
```css
:root {
  --primary: #2563eb;    /* Light & Dark */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #000;  /* Jen background/foreground se mění! */
    --foreground: #fff;
  }
}
```

### ❌ CHYBA 3: Hardkódované Barvy v Komponentách
```jsx
// ŠPATNĚ
className="bg-blue-600 text-white"

// SPRÁVNĚ
className="bg-primary text-white"
```

### ❌ CHYBA 4: Změna Semantic Barev
```css
/* NIKDY NEMĚŇTE! */
--success: #059669;   /* Vždy zelená! */
--warning: #d97706;   /* Vždy oranžová! */
--danger: #dc2626;    /* Vždy červená! */
```
Uživatelé očekávají, že červená = chyba, zelená = OK.

---

## CHECKLIST - PŘED COMMIT

Před tím, než commitnete změny:

- [ ] Všechny primární barvy v `globals.css` změněny
- [ ] Dark mode background/foreground změněn
- [ ] `tailwind.config.ts` používá CSS variables
- [ ] Role barvy v `AgentCard.tsx` změněny (pokud potřeba)
- [ ] Role barvy v `market-research/page.tsx` změněny (pokud potřeba)
- [ ] `ChatMessage.tsx` refaktorován na systémové barvy
- [ ] Dev server testován: `npm run dev`
- [ ] Build OK: `npm run build`
- [ ] Dark mode testován v OS
- [ ] Semantic barvy (success, warning, danger) ponechány

---

## ROLLBACK - Pokud Se Pokazí

Pokud se vám zobrazí chyba, prostě vraťte kód zpět:

```bash
# Vraťte poslední commitovanou verzi
git restore app/globals.css

# Nebo: Vrátit konkrétní soubor
git checkout HEAD -- app/globals.css
```

---

## TECHNICKÉ DETAILY

### Tailwind CSS 4 Syntax

Aplikace používá **Tailwind CSS 4**, která má novou `@theme` direktivu:

```css
@theme {
  --color-primary: var(--primary);
}
```

Je to ekvivalentní starému:
```javascript
theme: {
  colors: {
    primary: 'var(--primary)',
  }
}
```

### CSS Variable Fallback

Pokud chcete fallback (pro starší browsery):

```css
--primary: #4f46e5, fallback blue;
```

---

## DODATEČNÉ TIPY

### Tip 1: Online Color Tools
- https://tailwindcolor.com/ - Tailwind barvy
- https://coolors.co/ - Color palettes
- https://color.review/ - Contrast checker

### Tip 2: Hex to RGB Converter
```javascript
// Pokud potřebujete RGB místo HEX:
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
}
// Příklad: hexToRgb('#4f46e5') → 'rgb(79, 70, 229)'
```

### Tip 3: CSS Variable v Inline Stylu
```jsx
<div style={{ backgroundColor: 'var(--primary)' }}>
  Toto bude mít primary barvu
</div>
```

---

## AUTOMATIZACE - POKROČILÉ

Pokud máte design system a chcete **automaticky generovat** CSS variables:

```bash
# 1. Nainstalujte nástroj
npm install --save-dev pal-script

# 2. Vytvořte design.json
{
  "colors": {
    "primary": "#2563eb",
    "secondary": "#8b5cf6"
  }
}

# 3. Generujte CSS
npx pal-script generate design.json app/globals.css
```

---

## SHRNUTÍ: 3 Kroky k Nové Barvě

1. **Otevřete:** `app/globals.css`
2. **Změňte:** CSS variables v `:root` bloku
3. **Restart:** Dev server a hotovo! ✅

**Doba:** 2-5 minut
**Vliv:** Globální (celá aplikace)
**Riziko:** Nízké (jen změna barev)

---

**V PŘÍPADĚ OTÁZEK:**
- Přečtěte si `COLOR_SCHEME_ANALYSIS_REPORT.md`
- Ověřte syntaxi CSS
- Zkontrolujte dev server logs
- Zkoušejte v Chrome DevTools: `ctrl+shift+I` → Console → `getComputedStyle(document.documentElement).getPropertyValue('--primary')`

Happy coloring! 🎨
