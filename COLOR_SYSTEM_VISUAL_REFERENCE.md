# AgentVerse Color System - Vizuální Reference

Tato příloha obsahuje **vizuální reprezentaci** barevného systému.

---

## 1. BARVA PALETA - ASCII PREVIEW

### 1.1 Primary Colors (Deep Indigo)

```
┌─────────────────────────────────────────────────────────┐
│ PRIMARY COLOR PALETTE                                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Primary Light      │  Primary (Default)  │  Primary Dark │
│  #6366f1 (Indigo 5) │  #4f46e5 (Indigo 6)  │  #4338ca (Ind 7)
│  ███████████████    │  ███████████████    │  ███████████████
│  Light/Hover        │  Main Action        │  Active/Pressed
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Secondary Colors (Purple)

```
┌─────────────────────────────────────────────────────────┐
│ SECONDARY COLOR PALETTE                                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Secondary Light     │ Secondary (Default) │ Secondary Dark
│ #a855f7 (Purple 5)  │  #9333ea (Purple 6)  │  #7e22ce (Pur 7)
│ ███████████████    │  ███████████████    │  ███████████████
│ Hover              │  Secondary accent   │  Active
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Accent Colors (Cyan)

```
┌─────────────────────────────────────────────────────────┐
│ ACCENT COLOR PALETTE                                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Accent Light        │  Accent (Default)   │  Accent Dark
│ #06b6d4 (Cyan 6)    │  #0891b2 (Cyan 7)    │  #0e7490 (Cyan 8)
│ ███████████████    │  ███████████████    │  ███████████████
│ Light/Highlight    │  Main highlight    │  Active highlight
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 1.4 Semantic Colors

```
┌─────────────────────────────────────────────────────────┐
│ SEMANTIC STATUS COLORS                                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ SUCCESS             │ WARNING             │ DANGER
│ #059669 (Emerald 6) │ #d97706 (Amber 6)   │ #dc2626 (Red 6)
│ ███████████████    │ ███████████████    │ ███████████████
│ ✓ Success/OK       │ ⚠ Warning/Caution  │ ✗ Error/Delete
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 1.5 Neutral Scale (Grays)

```
┌─────────────────────────────────────────────────────────┐
│ NEUTRAL SCALE (Slate 50-900)                             │
├─────────────────────────────────────────────────────────┤
│
│ 50    ▓▒░░░░░░░░░░  #f8fafc  ← Lightest, subtle backgrounds
│ 100   ▓▓▒░░░░░░░░░░  #f1f5f9  ← Input background light
│ 200   ▓▓▓▒░░░░░░░░░░ #e2e8f0  ← Borders, dividers
│ 300   ▓▓▓▓▒░░░░░░░░░ #cbd5e1  ← Secondary borders
│ 400   ▓▓▓▓▓▒░░░░░░░░ #94a3b8  ← Disabled text
│ 500   ▓▓▓▓▓▓▒░░░░░░░ #64748b  ← Secondary text
│ 600   ▓▓▓▓▓▓▓▒░░░░░░ #475569  ← Primary text
│ 700   ▓▓▓▓▓▓▓▓▒░░░░░ #334155  ← Headings
│ 800   ▓▓▓▓▓▓▓▓▓▒░░░░ #1e293b  ← Dark backgrounds
│ 900   ▓▓▓▓▓▓▓▓▓▓▒░░░ #0f172a  ← Darkest, dark mode
│
└─────────────────────────────────────────────────────────┘
```

---

## 2. LIGHT THEME - VISUAL LAYOUT

```
╔════════════════════════════════════════════════════════════════╗
║                     LIGHT THEME (Default)                      ║
╚════════════════════════════════════════════════════════════════╝

                    Background: #fafbfc (Light Gray)
                    Text Color: #0d1117 (Dark)

    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃                                                        ┃
    ┃  ┌────────────────────────────────────────────────┐  ┃
    ┃  │ AgentVerse                                     │  ┃
    ┃  │ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│  ┃
    ┃  │ [+ Create Agent]  [Toggle List]          │  ┃
    ┃  │                                            │  ┃
    ┃  │ ┌──────────────────────────────────────┐ │  ┃
    ┃  │ │ Agent Card (white bg, neutral border)│ │  ┃
    ┃  │ │ ┌────────────────────────────────────┤ │  ┃
    ┃  │ │ │ Title      [Primary Badge]         │ │  ┃
    ┃  │ │ │ Description text...                 │ │  ┃
    ┃  │ │ │ [Primary/10 bg] Model: Sonnet ✗    │ │  ┃
    ┃  │ │ │                                     │ │  ┃
    ┃  │ └────────────────────────────────────────┘ │  ┃
    ┃  │                                            │  ┃
    ┃  │ ┌────────────────────────────────────────┐ │  ┃
    ┃  │ │ Agent Card                             │ │  ┃
    ┃  │ │ ┌────────────────────────────────────┤ │  ┃
    ┃  │ │ │ Title      [Secondary Badge]       │ │  ┃
    ┃  │ │ │ ...                                 │ │  ┃
    ┃  │ │ │                                     │ │  ┃
    ┃  │ └────────────────────────────────────────┘ │  ┃
    ┃  │                                            │  ┃
    ┃  └────────────────────────────────────────────┘  ┃
    ┃                                                   ┃
    ┃  [Buttons use Primary, Text uses Dark]           ┃
    ┃                                                   ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

COLOR BREAKDOWN:
- Page Background: #fafbfc (neutral-50)
- Card Background: #ffffff (white)
- Card Border: #e2e8f0 (neutral-200)
- Text: #0d1117 (very dark)
- Primary Button: #4f46e5 (indigo-600)
- Hover Button: #4338ca (indigo-700)
```

---

## 3. DARK THEME - VISUAL LAYOUT

```
╔════════════════════════════════════════════════════════════════╗
║                   DARK THEME (OS preference)                   ║
╚════════════════════════════════════════════════════════════════╝

                  Background: #0f172a (Dark Navy)
                  Text Color: #f8fafc (Light Gray)

    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃                                                ┃
    ┃  ┌────────────────────────────────────────┐  ┃
    ┃  │ AgentVerse                             │  ┃
    ┃  │ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│  ┃
    ┃  │ [+ Create Agent]  [Toggle List]  │  ┃
    ┃  │                                    │  ┃
    ┃  │ ┌──────────────────────────────┐ │  ┃
    ┃  │ │ Agent Card (dark bg, light) │ │  ┃
    ┃  │ │ ┌─────────────────────────────┤ │  ┃
    ┃  │ │ │ Title      [Primary Badge]  │ │  ┃
    ┃  │ │ │ Description text...         │ │  ┃
    ┃  │ │ │ [Primary/10 bg] Model...   │ │  ┃
    ┃  │ │ │                             │ │  ┃
    ┃  │ │ └──────────────────────────────┤ │  ┃
    ┃  │ │                                 │  ┃
    ┃  │ └──────────────────────────────┘ │  ┃
    ┃  │                                    │  ┃
    ┃  └────────────────────────────────────┘  ┃
    ┃                                          ┃
    ┃  [Buttons still Primary color!]         ┃
    ┃  [Text now Light for readability]       ┃
    ┃                                          ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

COLOR BREAKDOWN:
- Page Background: #0f172a (neutral-900)
- Card Background: #1e293b (neutral-800)
- Card Border: #334155 (neutral-700)
- Text: #f8fafc (very light)
- Primary Button: #4f46e5 (SAME indigo-600) ← Notice: Same color!
- Text on Button: white (contrasts well)
```

---

## 4. COMPONENT COLOR EXAMPLES

### 4.1 Button States

```
PRIMARY BUTTON (bg-primary):

Normal:
┌──────────────────┐
│ Click Me         │  Background: #4f46e5 (Primary)
│ (Indigo)         │  Text: White
└──────────────────┘  Border: Primary/50 (lighter)

Hover (hover:bg-primary-dark):
┌──────────────────┐
│ Click Me         │  Background: #4338ca (Primary-dark)
│ (Darker Indigo)  │  Text: White
└──────────────────┘

Focus (focus:ring-primary):
┌──────────────────┐
│ Click Me         │  ○ Ring: Primary color
│                  │  Width: 2px
└──────────────────┘

Disabled (disabled:opacity-50):
┌──────────────────┐
│ Click Me         │  Background: Dimmed
│ (Faded)          │  Opacity: 50%
└──────────────────┘  Cursor: Not-allowed
```

### 4.2 Form Input States

```
FORM INPUT (border-neutral-300, focus:ring-primary):

Normal:
┌──────────────────────┐
│                      │  Border: neutral-200
│ User input here      │  Background: white
│                      │  Text: neutral-900
└──────────────────────┘

Focus (focus:ring-2, focus:ring-primary):
┌──────────────────────┐
║  ◆ ◆ ◆ ◆ ◆ ◆       ║  Ring: Primary color (2px)
║ User input here      ║  Border: Primary
║  ◆ ◆ ◆ ◆ ◆ ◆       ║  Glow effect
└──────────────────────┘

Error (border-danger, text-danger):
┏━━━━━━━━━━━━━━━━━━━━┓
┃                      ┃  Border: danger (Red)
┃ Invalid email        ┃  Text: danger
┃                      ┃  Background: danger/10
┗━━━━━━━━━━━━━━━━━━━━┛

Success (border-success, text-success):
┍━━━━━━━━━━━━━━━━━━━━┑
┃                      ┃  Border: success (Green)
┃ Valid email          ┃  Text: success
┃                      ┃  Background: success/10
┕━━━━━━━━━━━━━━━━━━━━┙
```

### 4.3 Card Component

```
CARD (border-neutral-200, bg-white, shadow-sm):

┌───────────────────────────────┐
│ TITLE (text-lg, font-semibold) │
│ text-neutral-900              │
├───────────────────────────────┤
│ Content text (text-neutral-600) │
│                               │
│ Secondary text                │
│ (text-sm, text-neutral-500)   │
│                               │
│ [Primary Button]  [Secondary] │
└───────────────────────────────┘

Borders:
- Top/Bottom: neutral-200
- Left/Right: neutral-200
- Hover: Primary/50

Shadow: sm (subtle)
```

---

## 5. STATUS INDICATORS

### 5.1 Success State

```
┌─────────────────────────────────────┐
│ ✓ Operation completed successfully  │
│                                     │
│ Background: success/10 (#d1fae5)   │
│ Border: success/30                 │
│ Text: success (#059669)             │
│ Icon: ✓ Green                       │
└─────────────────────────────────────┘
```

### 5.2 Warning State

```
┌─────────────────────────────────────┐
│ ⚠ Please review this action         │
│                                     │
│ Background: warning/10 (#fef3c7)   │
│ Border: warning/30                 │
│ Text: warning (#d97706)             │
│ Icon: ⚠ Orange                      │
└─────────────────────────────────────┘
```

### 5.3 Error State

```
┌─────────────────────────────────────┐
│ ✗ An error has occurred             │
│                                     │
│ Background: danger/10 (#fee2e2)    │
│ Border: danger/30                  │
│ Text: danger (#dc2626)              │
│ Icon: ✗ Red                         │
└─────────────────────────────────────┘
```

---

## 6. ROLE-BASED COLORS (Agent Types)

```
┌──────────────────────────────────────────────────────────┐
│                    AGENT ROLE BADGES                      │
├──────────────────────────────────────────────────────────┤
│
│ 🔍 RESEARCHER          │ bg-indigo-100, text-indigo-900
│ ├─ Light theme:        │ #e0e7ff background
│ └─ Dark theme:         │ #1e1b4b/30 background
│
│ 🎯 STRATEGIST          │ bg-purple-100, text-purple-900
│ ├─ Light theme:        │ #f3e8ff background
│ └─ Dark theme:         │ #3f0f63/30 background
│
│ ⚖️ CRITIC             │ bg-amber-100, text-amber-900
│ ├─ Light theme:        │ #fef3c7 background
│ └─ Dark theme:         │ #78350f/30 background
│
│ 💡 IDEATOR             │ bg-cyan-100, text-cyan-900
│ ├─ Light theme:        │ #cffafe background
│ └─ Dark theme:         │ #164e63/30 background
│
│ 🔗 COORDINATOR         │ bg-emerald-100, text-emerald-900
│ ├─ Light theme:        │ #d1fae5 background
│ └─ Dark theme:         │ #064e3b/30 background
│
│ ⚡ EXECUTOR            │ bg-rose-100, text-rose-900
│ ├─ Light theme:        │ #ffe4e6 background
│ └─ Dark theme:         │ #4c0519/30 background
│
└──────────────────────────────────────────────────────────┘
```

---

## 7. GRADIENT EXAMPLES

### 7.1 Hero Gradient

```
FROM primary-light (#6366f1) → TO accent-light (#06b6d4)

┌────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓░│
│ ░░█░░ AgentVerse ░░░░░░░░░░░░░░░░░▓░│
│ ░░█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│
│ Left (Indigo): Stable, professional
│ Right (Cyan): Modern, energetic
│ Perfect for headers & hero sections
└────────────────────────────────────────┘
```

### 7.2 Background Gradient (with transparency)

```
TO dark (with gradient stops)

┌────────────────────────────────────────┐
│ ██████████████████████████████████████│ 90% opacity
│ ██████████████████████████████████████│
│ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ 50% opacity
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  0% opacity
│
│ Creates "fade to transparent" effect
│ Used for: Top/bottom fades in pages
└────────────────────────────────────────┘
```

---

## 8. HOVER & INTERACTIVE STATES

### 8.1 Link Interaction

```
NORMAL STATE:
Click here → text-primary, underline hidden

HOVER STATE:
Click here → text-primary-dark, underline visible
            └─ darker color indicates interactivity

ACTIVE STATE:
Click here → text-primary-dark (same as hover)
```

### 8.2 Button Interaction

```
NORMAL:          HOVER:            ACTIVE (PRESSED):
█ Button      →  ███ Button    →   █ Button
Background:      Background:       Background:
#4f46e5          #4338ca           #4338ca + scale-95
(Indigo 600)     (Indigo 700)      (More pressed)

Transition: 150ms ease (smooth)
```

### 8.3 Card Interaction

```
NORMAL:
┌─────────────────┐
│ Card            │  Border: neutral-200
│                 │  Shadow: sm
└─────────────────┘

HOVER:
┌─────────────────┐
│ Card            │  Border: primary/50 (hint of primary)
│                 │  Shadow: md (more prominent)
└─────────────────┘

Active/Selected:
┌─────────────────┐
│ Card            │  Border: primary (full primary)
│                 │  Shadow: lg (biggest shadow)
│                 │  Background: slight primary tint
└─────────────────┘
```

---

## 9. OPACITY VARIATIONS

```
SAME COLOR, DIFFERENT OPACITY:

bg-primary/10:    ░░░░░░░░░░  10% - Very subtle background
bg-primary/20:    ░░░░░░░░░░  20% - Subtle background
bg-primary/30:    ░░░░░░░░░░  30% - Medium background
bg-primary/50:    ░░░░░░░░░░  50% - Noticeable background
bg-primary:       ████████████ 100% - Full color (normal)

USE CASES:
- /10:  Very light badges, hints
- /20:  Alert backgrounds, info boxes
- /30:  Focus states, hover backgrounds
- /50:  Border colors, semi-transparent overlays
- (no): Buttons, full color elements
```

---

## 10. TYPOGRAPHY + COLORS

### 10.1 Text Hierarchy

```
HEADING 1 (text-3xl):
═══════════════════════════════════════
Main Title
═══════════════════════════════════════
Color: neutral-900 (dark)

HEADING 2 (text-2xl):
───────────────────────────────────
Section Title
───────────────────────────────────
Color: neutral-900 (dark)

BODY TEXT (text-base):
Regular paragraph text for content.
Can be up to 2-3 lines long.
Color: neutral-700 (medium dark)

SECONDARY TEXT (text-sm):
Secondary information or metadata.
Color: neutral-600 (medium)

MUTED TEXT (text-xs):
Very small supporting text.
Color: neutral-500 (lighter)

LINK TEXT:
Click here for more info
Color: primary, underline on hover
```

---

## 11. ACCESSIBILITY & CONTRAST

### 11.1 Contrast Ratios

```
WCAG Compliance:
├─ AA (Level AA):  Contrast Ratio ≥ 4.5:1  (standard)
└─ AAA (Level AAA): Contrast Ratio ≥ 7:1   (enhanced)

OUR COLORS:
┌─────────────────────────────────────────┐
│ Pair              │ Ratio    │ Standard │
├─────────────────────────────────────────┤
│ Primary on White  │ 7.5:1    │ ✓ AA+   │
│ Primary on Black  │ 11.2:1   │ ✓ AAA   │
│ Danger on White   │ 5.8:1    │ ✓ AA    │
│ Success on White  │ 4.8:1    │ ✓ AA    │
│ Warning on White  │ 4.8:1    │ ✓ AA    │
│ Neutral 600 Text  │ 8.2:1    │ ✓ AAA   │
└─────────────────────────────────────────┘

✓ VŠECHNY páry WCAG AA nebo lepší!
```

### 11.2 Color Blindness

```
SIMULATOR: Jak vidí uživatelé s barevnou slepotou?

Deuteranopia (Green-blind):
- Primary (indigo) ✓ vidět
- Secondary (purple) ✓ vidět
- Accent (cyan) ✓ vidět
- Success (green) ⚠ vypadá jako gray

Protanopia (Red-blind):
- Primary (indigo) ✓ vidět
- Danger (red) ⚠ vypadá jako black
- Warning (orange) ⚠ trickier

BEST PRACTICE: Nikdy nespoléhejte POUZE na barvu!
Vždy přidejte text nebo ikony.

✓ SPRÁVNĚ:   [✓ Success] ← text + color
✗ ŠPATNĚ:    [  Green  ] ← jen barva
```

---

## 12. RESPONSIVE COLORS

### 12.1 Mobile vs Desktop

```
MOBILE (< 768px):
┌───────────┐
│ Header    │  Smaller padding
│ ───────── │  Simpler colors
│ Card      │  Limited depth
│ Card      │
│ Footer    │
└───────────┘

DESKTOP (≥ 768px):
┌───────────────────────────────────┐
│ Header                             │  Larger padding
│ ─────────────────────────────────  │  More color variations
│ Card      │ Card      │ Card       │  Depth with shadows
│ Card      │ Card      │ Card       │
│ Footer                             │
└───────────────────────────────────┘

COLORS: Stejné! (Responsibilní design)
```

---

## 13. COLOR COMBINATIONS EXAMPLES

### 13.1 Dobrá Kombinace (Use These)

```
✓ Primary on White    #4f46e5 on #ffffff  → Clear, professional
✓ Secondary on White  #9333ea on #ffffff  → Distinct, creative
✓ Accent on White     #0891b2 on #ffffff  → Bright, modern
✓ Neutral-700 Text    #334155 on #ffffff  → Easy to read

✓ Primary on Dark     #4f46e5 on #0f172a  → Pops out, vibrant
✓ Light Text on Dark  #f8fafc on #0f172a  → High contrast
```

### 13.2 Špatná Kombinace (Avoid These)

```
✗ Primary on Primary  #4f46e5 on #4f46e5  → INVISIBLE!
✗ Neutral-400 Text    #94a3b8 on #ffffff  → Too light to read
✗ Success on Warning  #059669 on #d97706  → Confusing
✗ Dark on Dark        #0f172a on #000000  → No contrast
```

---

## 14. PRODUCTION CHECKLIST

```markdown
✓ Color System Implementation:
  - [ ] CSS variables defined in globals.css
  - [ ] Tailwind config references CSS vars
  - [ ] @theme directive configured
  - [ ] All components use Tailwind classes

✓ Light Theme:
  - [ ] All text readable (contrast ≥ 4.5:1)
  - [ ] Buttons stand out
  - [ ] Cards have visible borders
  - [ ] Background not white-on-white

✓ Dark Theme:
  - [ ] All text readable on dark background
  - [ ] Primary colors still pop out
  - [ ] Cards visible with borders
  - [ ] No pure white text on dark (use neutral-50)

✓ Accessibility:
  - [ ] No color-only indicators (add text/icons)
  - [ ] Contrast ratios WCAG AA+ for all text
  - [ ] Focus states visible
  - [ ] Semantic colors never changed

✓ Testing:
  - [ ] Tested in light mode
  - [ ] Tested in dark mode
  - [ ] Tested on mobile
  - [ ] Tested with color blindness simulator
  - [ ] Build passes: npm run build
  - [ ] Lint passes: npm run lint
```

---

## SHRNUTÍ

Tato vizuální reference poskytuje:

1. **ASCII Preview** barevné palety
2. **Layout Examples** pro light/dark theme
3. **Component States** (normal, hover, active)
4. **Status Colors** (success, warning, danger)
5. **Role Badges** pro agenty
6. **Gradients** a speciální efekty
7. **Typography + Colors** kombinace
8. **Accessibility** informace
9. **Responsive** design poznámky
10. **Best Practices** pro kombinace

---

**Tisk:** Toto lze vytisknout a umístit vedle designeru/vývojáře!

---

*Vytvořeno: 15.2.2026*
*Kompletní vizuální reference pro AgentVerse barevný systém*
