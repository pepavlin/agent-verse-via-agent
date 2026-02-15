# AgentVerse - Kompletní Analýza Barevného Schématu

**Datum Analýzy:** 15. února 2026
**Aplikace:** AgentVerse (Next.js + React + Tailwind CSS)
**Verze Next.js:** 16.1.6
**Verze React:** 19.2.3
**Verze Tailwind CSS:** 4

---

## 1. BAREVNÁ PALETA A DESIGN SYSTEM

### 1.1 Aktuální Barevný Systém

Aplikace AgentVerse používá **moderní, profesionální barevný systém** založený na **CSS Custom Properties (CSS Variables)** a **Tailwind CSS v4**.

#### Primární Barvy:

| Barva | Název | Primární Barva | Kód | Popis |
|-------|-------|----------------|-----|-------|
| **Primary** | Deep Indigo | #4f46e5 (Indigo 600) | `--primary` | Profesionální tech barva pro primární akce |
| **Primary Light** | - | #6366f1 (Indigo 500) | `--primary-light` | Světlejší varianta pro hovery |
| **Primary Dark** | - | #4338ca (Indigo 700) | `--primary-dark` | Tmavší varianta pro aktivní stav |
| **Secondary** | Purple | #9333ea (Purple 600) | `--secondary` | Kreativní/AI pocit, akcentní prvky |
| **Secondary Light** | - | #a855f7 (Purple 500) | `--secondary-light` | Světlejší purple |
| **Secondary Dark** | - | #7e22ce (Purple 700) | `--secondary-dark` | Tmavší purple |
| **Accent** | Cyan | #0891b2 (Cyan 700) | `--accent` | Moderní tech barva pro zvýraznění |
| **Accent Light** | - | #06b6d4 (Cyan 600) | `--accent-light` | Světlejší cyan |
| **Accent Dark** | - | #0e7490 (Cyan 800) | `--accent-dark` | Tmavší cyan |

#### Sémantické Barvy:

| Typ | Barva | Kód | Popis |
|-----|-------|-----|-------|
| **Success** | Emerald 600 | #059669 | Úspěšné akce, potvrení |
| **Warning** | Amber 600 | #d97706 | Varování, pozor |
| **Danger** | Red 600 | #dc2626 | Chyby, nebezpečí, smazání |

#### Neutrální Paleta (Šedá škála):

| Úroveň | Kód | Tailwind | Popis |
|--------|-----|---------|-------|
| 50 | #f8fafc | Slate 50 | Nejsvětlejší |
| 100 | #f1f5f9 | Slate 100 | |
| 200 | #e2e8f0 | Slate 200 | |
| 300 | #cbd5e1 | Slate 300 | |
| 400 | #94a3b8 | Slate 400 | |
| 500 | #64748b | Slate 500 | Střední |
| 600 | #475569 | Slate 600 | |
| 700 | #334155 | Slate 700 | |
| 800 | #1e293b | Slate 800 | |
| 900 | #0f172a | Slate 900 | Nejčernější |

#### Pozadí a Text:

- **Light Theme:**
  - Background: #fafbfc (velmi lehké šedé)
  - Foreground: #0d1117 (tmavý text)

- **Dark Theme** (automaticky se zapne s `prefers-color-scheme: dark`):
  - Background: #0f172a (velmi tmavé)
  - Foreground: #f8fafc (lehký text)

---

## 2. DEFINOVÁNÍ BAREV - TECHNICKÉ ŘEŠENÍ

### 2.1 CSS Variables (Primární Zdroj)

**Soubor:** `app/globals.css` (řádky 3-82)

Všechny barvy jsou definovány jako **CSS Custom Properties** v root scopu:

```css
:root {
  /* Light theme - Modern & Professional */
  --background: #fafbfc;
  --foreground: #0d1117;

  /* Primary colors */
  --primary: #4f46e5;
  --primary-light: #6366f1;
  --primary-dark: #4338ca;

  /* Secondary colors */
  --secondary: #9333ea;
  --secondary-light: #a855f7;
  --secondary-dark: #7e22ce;

  /* Accent colors */
  --accent: #0891b2;
  --accent-light: #06b6d4;
  --accent-dark: #0e7490;

  /* Semantic colors */
  --success: #059669;
  --warning: #d97706;
  --danger: #dc2626;

  /* Neutral scale */
  --neutral-50: #f8fafc;
  --neutral-100: #f1f5f9;
  --neutral-200: #e2e8f0;
  --neutral-300: #cbd5e1;
  --neutral-400: #94a3b8;
  --neutral-500: #64748b;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1e293b;
  --neutral-900: #0f172a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f172a;
    --foreground: #f8fafc;
  }
}
```

### 2.2 Tailwind Configuration

**Soubor:** `tailwind.config.ts` (řádky 8-54)

Tailwind je konfigurován tak, aby **referoval CSS variables**:

```typescript
theme: {
  extend: {
    colors: {
      background: 'var(--background)',
      foreground: 'var(--foreground)',

      primary: {
        light: 'var(--primary-light)',
        DEFAULT: 'var(--primary)',
        dark: 'var(--primary-dark)',
      },

      secondary: {
        light: 'var(--secondary-light)',
        DEFAULT: 'var(--secondary)',
        dark: 'var(--secondary-dark)',
      },

      accent: {
        light: 'var(--accent-light)',
        DEFAULT: 'var(--accent)',
        dark: 'var(--accent-dark)',
      },

      success: 'var(--success)',
      warning: 'var(--warning)',
      danger: 'var(--danger)',

      neutral: {
        50: 'var(--neutral-50)',
        100: 'var(--neutral-100)',
        // ... ostatní úrovně
        900: 'var(--neutral-900)',
      },
    },
  },
}
```

### 2.3 @theme Direktiva

V `app/globals.css` (řádky 41-67) je použita Tailwind CSS 4 `@theme` direktiva:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);

  --color-neutral-50: var(--neutral-50);
  /* ... ostatní úrovně ... */

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### 2.4 Hardkódované Barvy v Komponentách

Vedle systémových barev se v některých komponentách vyskytují i **hardkódované Tailwind barvy**:

- **Barvy Agent Rolí** (AgentCard.tsx, market-research/page.tsx):
  - Researcher: `indigo-100`, `indigo-900`, `indigo-300`
  - Strategist: `purple-100`, `purple-900`, `purple-300`
  - Critic: `amber-100`, `amber-900`, `amber-300`
  - Ideator: `cyan-100`, `cyan-900`, `cyan-300`
  - Coordinator: `emerald-100`, `emerald-900`, `emerald-300`
  - Executor: `rose-100`, `rose-900`, `rose-300`

---

## 3. PŘEHLED KOMPONENT A STRÁNEK S BARVAMI

### 3.1 Stránky (Pages)

| Soubor | Cesta | Hlavní Barevné Prvky | Poznámka |
|--------|-------|----------------------|----------|
| `page.tsx` | `/` (Home/Game) | Primary, Secondary, Accent, Neutral, Success | Tmavý background s gradientem |
| `login/page.tsx` | `/login` | Primary, Danger, Neutral | Formulář |
| `register/page.tsx` | `/register` | Primary, Danger, Neutral | Formulář |
| `agents/page.tsx` | `/agents` | Primary, Neutral, Role-based colors | Seznam agentů |
| `agents/[agentId]/page.tsx` | `/agents/{id}` | Primary, Neutral, Role-based colors | Detail agenta |
| `departments/page.tsx` | `/departments` | Primary, Neutral, Danger, Success | Informační sekce |
| `departments/market-research/page.tsx` | `/departments/market-research` | Primary, Neutral, Role-based colors, Success | Oddělení s úkoly |
| `visualization/page.tsx` | `/visualization` | Primary, Accent, Neutral | Vizualizace agentů |
| `game/page.tsx` | `/game` | Primary, Secondary, Accent | Game canvas |
| `dashboard/page.tsx` | `/dashboard` | Neutral | Redirect na agents |

### 3.2 React Komponenty (Components)

| Soubor | Komponenta | Hlavní Barvy | Typ Barev |
|--------|-----------|--------------|-----------|
| `AgentCard.tsx` | AgentCard | Primary, Neutral, Role-specific | Systémové + Role |
| `AgentChatDialog.tsx` | AgentChatDialog | Primary, Neutral, Success | Systémové |
| `AgentSidebar.tsx` | AgentSidebar | Primary, Neutral, Accent | Systémové |
| `AgentStatusBar.tsx` | AgentStatusBar | Primary, Success, Warning, Danger | Sémantické |
| `AgentToolbar.tsx` | AgentToolbar | Primary, Neutral | Systémové |
| `AgentVisualization.tsx` | AgentVisualization | Primary, Accent, Secondary | Systémové |
| `AuthForm.tsx` | AuthForm | Primary, Danger, Neutral | Systémové |
| `ChatMessage.tsx` | ChatMessage | Blue, Gray (hardkódované) | Tailwind (NEVLASTNÍ BARVY!) |
| `CreateAgentModal.tsx` | CreateAgentModal | Primary, Neutral, Danger | Systémové |
| `DepartmentCard.tsx` | DepartmentCard | Primary, Neutral | Systémové |
| `DeploymentInfo.tsx` | DeploymentInfo | Primary, Neutral | Systémové |
| `Footer.tsx` | Footer | Primary, Neutral | Systémové |
| `GameCanvas.tsx` | GameCanvas | Primary, Secondary, Accent, Neutral | Systémové |
| `GlobalChat.tsx` | GlobalChat | Primary, Neutral, Blue | Mix |

### 3.3 Starší Komponenty (components/ adresář)

| Soubor | Poznámka |
|--------|----------|
| `components/Layout.tsx` | Starší komponenta |
| `components/Navigation.tsx` | Starší komponenta |
| `components/DeployInfo.tsx` | Starší komponenta |

---

## 4. SEZNAM VŠECH SOUBORŮ K ÚPRAVĚ PRO ZMĚNU BAREVNÉHO SCHÉMATU

### 4.1 KRITICKÉ SOUBORY (POVINNÉ K ÚPRAVĚ)

#### 🔴 Primární Configuration Files (VŽDY MĚNIT)

1. **`app/globals.css`** ⭐ **NEJDŮLEŽITĚJŠÍ**
   - Definuje všechny CSS variables
   - Řádky: 3-82
   - Obsahuje: Všechny barvy pro light i dark theme
   - Vliv: Globální vliv na celou aplikaci

2. **`tailwind.config.ts`** ⭐ **VELMI DŮLEŽITÉ**
   - Mapuje CSS variables na Tailwind třídy
   - Řádky: 8-54
   - Obsahuje: Definice color palette
   - Vliv: Určuje dostupné Tailwind barvy

#### 🟠 Komponenty s Hardkódovanými Barvami Role (MĚNIT V PŘÍPADĚ POTŘEBY)

3. **`app/components/AgentCard.tsx`**
   - Řádky: 20-27
   - Hardkódovaný object: `roleColors`
   - Barvy pro: researcher, strategist, critic, ideator, coordinator, executor
   - Změna: Pokud chcete změnit barvy pro role agentů

4. **`app/departments/market-research/page.tsx`**
   - Řádky: ~20-25
   - Hardkódovaný object: `colors` pro role
   - Barvy pro: researcher, strategist, critic, ideator
   - Změna: Pokud chcete změnit barvy v oddělení

### 4.2 KOMPONENTY S VLASTNÍMI BARVAMI (UPOZORNĚNÍ)

#### 🟡 Komponenty s Nekonzistentními Barvami

5. **`app/components/ChatMessage.tsx`** ⚠️
   - Řádky: 18-25
   - Problémy: Hardkódované barvy (`bg-blue-600`, `bg-gray-200`)
   - **NEPOUŽÍVÁ SYSTÉMOVÉ BARVY!**
   - Doporučení: Refaktorovat na systémové barvy (primary/secondary)

### 4.3 VŠECHNY STRÁNKY S BARVAMI (NEMĚNIT PŘÍMĚ, ALE MOHOU OBSAR̆OVAT CUSTOM STYLY)

6. **`app/page.tsx`** (Home/Game)
   - Řádky: 49-176
   - Používá: Primary, Secondary, Accent, Success, Neutral
   - Typ: Gradientní design s primárními barvami

7. **`app/login/page.tsx`**
   - AuthForm komponenta
   - Používá: Primary, Danger, Neutral

8. **`app/register/page.tsx`**
   - AuthForm komponenta
   - Používá: Primary, Danger, Neutral

9. **`app/agents/page.tsx`**
   - AgentCard komponenty
   - Používá: Primary, Neutral, Role-specific

10. **`app/agents/[agentId]/page.tsx`**
    - Detail agenta
    - Používá: Primary, Neutral, Role-specific

11. **`app/departments/page.tsx`**
    - Používá: Primary, Danger, Success, Neutral

12. **`app/departments/market-research/page.tsx`**
    - Role-specific barvy
    - Stavy (pending, in_progress, completed, failed, skipped)

13. **`app/visualization/page.tsx`**
    - Vizualizace agentů

14. **`app/game/page.tsx`**
    - Game interface

15. **`app/dashboard/page.tsx`**
    - Redirect (minimálně barev)

### 4.4 KOMPONENTY V app/components/ (NEMĚNIT PŘÍMĚ)

- `AgentChatDialog.tsx`
- `AgentSidebar.tsx`
- `AgentStatusBar.tsx`
- `AgentToolbar.tsx`
- `AgentVisualization.tsx`
- `CreateAgentModal.tsx`
- `DepartmentCard.tsx`
- `DeploymentInfo.tsx`
- `Footer.tsx`
- `GameCanvas.tsx`
- `GlobalChat.tsx`
- `Providers.tsx` (Context)

---

## 5. DOSTUPNÉ TAILWIND BARVY V APLIKACI

### 5.1 Vlastní Systémové Barvy (Z Config)

```
primary (DEFAULT, light, dark)
primary-light
primary-dark
secondary (DEFAULT, light, dark)
secondary-light
secondary-dark
accent (DEFAULT, light, dark)
accent-light
accent-dark
success
warning
danger
neutral (50-900 stupnů)
background
foreground
```

### 5.2 Standardní Tailwind Barvy (Stále Dostupné)

Aplikace může používat libovolné Tailwind barvy:
- `blue-*` (blue-100 až blue-900)
- `red-*`, `green-*`, `yellow-*`, `purple-*`, `indigo-*`, `cyan-*`, `pink-*`, `orange-*`, `teal-*`, `rose-*`, `amber-*`, `emerald-*`, `gray-*`, atd.

**POZNÁMKA:** Některé komponenty používají tyto standardní barvy, což není ideální pro konzistenci.

---

## 6. TMAVÝ REŽIM

Aplikace má podporu tmavého režimu:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f172a;
    --foreground: #f8fafc;
  }
}
```

**Použití v komponentách:**
```jsx
className="bg-white dark:bg-neutral-800"
className="text-neutral-900 dark:text-neutral-50"
```

---

## 7. DETAILNÍ PŘEHLED TŘÍD S BARVAMI

### 7.1 Nejčastěji Používané Barvy v Kódu

| Třídy | Počet Výskytů | Primární Komponenty |
|-------|---------------|-------------------|
| `bg-neutral-*` | ++++ | Všechny komponenty |
| `text-neutral-*` | ++++ | Všechny komponenty |
| `border-neutral-*` | +++ | Karty, dialogy |
| `bg-primary` | +++ | Tlačítka, akcenty |
| `text-primary` | ++ | Odkazy, zvýraznění |
| `bg-white dark:bg-neutral-800` | +++ | Kontejnery |
| `bg-gradient-to-*` | ++ | Home page, visual effects |
| Role-specific barvy | ++ | AgentCard |

### 7.2 Příklady Hardkódovaných Barev (NEPOUŽÍVAT)

```
bg-blue-600, text-white           (ChatMessage.tsx)
bg-gray-200, text-gray-900        (ChatMessage.tsx)
bg-indigo-100, bg-indigo-900      (Agent roles)
bg-purple-100, bg-purple-900      (Agent roles)
bg-amber-100, bg-amber-900        (Agent roles)
bg-cyan-100, bg-cyan-900          (Agent roles)
bg-emerald-100, bg-emerald-900    (Agent roles)
bg-rose-100, bg-rose-900          (Agent roles)
```

---

## 8. DOPORUČENÍ PRO ZMĚNU BAREVNÉHO SCHÉMATU

### 8.1 Jednoduchá Změna (DOPORUČENO)

Pokud chcete změnit pouze hodnoty barev, upravte **pouze tyto soubory**:

1. **`app/globals.css`** - Změňte hex kódy v CSS variables
2. Hotovo! Všechny komponenty automaticky převezmou nové barvy

### 8.2 Změna Struktury Barev (POKROČILÉ)

Pokud chcete přidat nové kategorie barev:

1. Přidejte proměnné do `app/globals.css` (`:root` blok)
2. Přidejte mapování do `tailwind.config.ts` (theme.extend.colors)
3. Přidejte do `@theme` direktivy v `app/globals.css`

### 8.3 Refaktoring Hardkódovaných Barev

Komponenty se doporučuje refaktorovat:

1. `app/components/ChatMessage.tsx` - Použít `bg-primary` místo `bg-blue-600`
2. `app/components/AgentCard.tsx` - Zvážit CSS variables pro role barvy
3. `app/departments/market-research/page.tsx` - Totéž

---

## 9. TECHNICKÁ METADATA

### 9.1 Struktura Souboru globals.css

```
Řádky 1-1:    Import Tailwind
Řádky 3-39:   :root CSS variables (light theme)
Řádky 41-67:  @theme direktiva
Řádky 69-74:  @media (prefers-color-scheme: dark)
Řádky 76-82:  Body styling
```

### 9.2 Struktura tailwind.config.ts

```
Řádky 1-7:    Config header + content paths
Řádky 8-70:   theme.extend
  Řádky 10-54:  colors
  Řádky 55-68:  fontFamily, boxShadow, backdropBlur
Řádky 71-75:  Plugin & export
```

---

## 10. SEZNAM KOMPONENT V POŘADÍ IMPORTANCE

### 🔴 Kritické (Globální Dopad)

1. `app/globals.css` - CSS Variables (BASE)
2. `tailwind.config.ts` - Tailwind Config (BASE)

### 🟠 Vysoká Priorita (Viditelné v UI)

3. `app/page.tsx` - Home/Game page
4. `app/components/AgentCard.tsx` - Hlavní komponenta
5. `app/components/AuthForm.tsx` - Formuláře

### 🟡 Střední Priorita

6. `app/components/AgentChatDialog.tsx`
7. `app/components/CreateAgentModal.tsx`
8. `app/components/AgentStatusBar.tsx`
9. `app/components/Footer.tsx`

### 🟢 Nižší Priorita

10. Ostatní komponenty a stránky

---

## 11. RUNTIME BARVY

Aplikace při runtime vykresluje:

- **Dark theme automaticky** když je v OS nastaven tmavý režim
- **Gradienty** (Primary → Accent Light, Secondary → Primary)
- **Transparence** (barvy s `/10`, `/20`, `/30` pro subtle backgrounds)
- **Animace** (barvy na hover, focus states)

---

## 12. SHRNUTÍ

| Aspekt | Odpověď |
|--------|---------|
| **Barevná Paleta** | Modern tech: Indigo (Primary), Purple (Secondary), Cyan (Accent) |
| **Definování Barev** | CSS Variables v `globals.css` → Tailwind v `tailwind.config.ts` |
| **Dark Mode** | Automaticky s `@media prefers-color-scheme: dark` |
| **Hardkódované Barvy** | Minimálně (ChatMessage.tsx, AgentCard role colors) |
| **Kritické Soubory k Úpravě** | `app/globals.css` a `tailwind.config.ts` |
| **Počet Komponent** | 29 souborů s barvami (13 pages + 16 components) |
| **Systém** | Scalable, centralizovaný, modern |

---

## PŘÍLOHA A: SOUBORY S BARVAMI (ÚPLNÝ SEZNAM)

### Soubory s Barvami - Abecedně:

1. app/agents/[agentId]/page.tsx
2. app/agents/page.tsx
3. app/components/AgentCard.tsx
4. app/components/AgentChatDialog.tsx
5. app/components/AgentSidebar.tsx
6. app/components/AgentStatusBar.tsx
7. app/components/AgentToolbar.tsx
8. app/components/AgentVisualization.tsx
9. app/components/AuthForm.tsx
10. app/components/ChatMessage.tsx
11. app/components/CreateAgentModal.tsx
12. app/components/DepartmentCard.tsx
13. app/components/DeploymentInfo.tsx
14. app/components/Footer.tsx
15. app/components/GameCanvas.tsx
16. app/components/GlobalChat.tsx
17. app/dashboard/page.tsx
18. app/departments/market-research/page.tsx
19. app/departments/page.tsx
20. app/game/page.tsx
21. app/login/page.tsx
22. app/page.tsx
23. app/register/page.tsx
24. app/visualization/page.tsx
25. app/globals.css ⭐ (CSS Variables)
26. app/layout.tsx
27. components/DeployInfo.tsx
28. components/Layout.tsx
29. components/Navigation.tsx
30. tailwind.config.ts ⭐ (Tailwind Config)
31. postcss.config.mjs (Tailwind pipeline)

---

## PŘÍLOHA B: PŘÍKLADY BARVA USAGE PATTERN

### Pattern 1: Systemové Barvy
```jsx
className="bg-primary text-white hover:bg-primary-dark"
className="border border-primary-light"
```

### Pattern 2: Neutral Scale
```jsx
className="bg-neutral-50 dark:bg-neutral-900"
className="text-neutral-700 dark:text-neutral-300"
```

### Pattern 3: Gradients
```jsx
className="bg-gradient-to-r from-primary-light to-accent-light"
```

### Pattern 4: Semantic
```jsx
className="bg-success text-white"
className="bg-danger/10 text-danger border border-danger/30"
```

### Pattern 5: Role-Based (HARDCODED)
```jsx
const roleColors = {
  researcher: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
  // ...
}
```

---

**Report vytvořen:** 15.2.2026 - Kompletní analýza barevného schématu aplikace AgentVerse
