# PRD -- Packing Checklist Micro Web App

## 1. Overview

Jednoduchá klientská webová aplikace (bez backendu), která generuje
personalizovaný checklist věcí na cestu.

### Technologie:

-   HTML5
-   Tailwind CSS (CDN)
-   Vanilla JavaScript (ES6)
-   Data uložena v externím `data.json`
-   Hostovatelné na GitHub Pages

Žádný build step. Žádný framework.

------------------------------------------------------------------------

## 2. Cíle

Uživatel nastaví: - počet nocí (0--10+, slider) - typ cesty (checkboxy)

Aplikace: - vygeneruje checklist položek - spočítá množství dle pravidel
(perNight + cap) - sloučí duplicity - umožní odškrtávání - uloží stav do
localStorage

------------------------------------------------------------------------

## 3. UX struktura stránky

### 3.1 Horní sekce -- konfigurace cesty

#### Slider:

-   Label: „Počet nocí"
-   Rozsah: 0--10
-   Hodnota 10 reprezentuje „10+"
-   Výchozí hodnota: 1
-   Zobrazuje aktuální hodnotu vedle slideru

#### Checkboxy:

Dynamicky generované z `data.json → tags`

------------------------------------------------------------------------

### 3.2 Spodní sekce -- vygenerovaný checklist

-   Rozděleno podle `group`
-   Každá položka obsahuje:
    -   checkbox
    -   název položky
    -   pokud qty \> 1 → zobrazení např. „Tričko × 3"
-   Seřazení:
    -   podle group
    -   uvnitř group podle labelu

------------------------------------------------------------------------

## 4. Datový model (`data.json`)

### 4.1 Struktura

``` json
{
  "tags": [
    { "id": "abroad", "label": "Do zahraničí" },
    { "id": "lan", "label": "Na LAN párty" },
    { "id": "nature", "label": "Do přírody" },
    { "id": "camp", "label": "Stanovat" },
    { "id": "sea", "label": "K moři" }
  ],
  "items": [
    {
      "id": "tshirt",
      "label": "Tričko",
      "group": "Oblečení",
      "when": { "any": ["*"] },
      "qty": { "type": "perNight", "value": 1, "cap": 7 }
    }
  ]
}
```

------------------------------------------------------------------------

### 4.2 Logika `when`

Podporované varianty:

-   `{ "any": ["*"] }` → vždy
-   `{ "any": ["lan", "camp"] }` → pokud je aktivní alespoň jeden z tagů
-   `{ "all": ["camp", "nature"] }` → pokud jsou aktivní všechny tagy

------------------------------------------------------------------------

### 4.3 Logika `qty`

#### fixed

``` json
"qty": { "type": "fixed", "value": 1 }
```

#### perNight

``` json
"qty": { "type": "perNight", "value": 1, "cap": 7 }
```

Výpočet:

    qty = nights * value
    if cap exists → qty = min(qty, cap)

Speciální pravidlo: - Pokud nights = 0 → všechny perNight položky mají
qty = 0 (nezobrazují se)

------------------------------------------------------------------------

## 5. Výpočetní logika

Při změně slideru nebo checkboxu: 1. Přepočítat seznam 2. Pro každý
item: - Pokud je splněna podmínka `when` - Spočítat qty - Pokud qty \> 0
→ přidat do výsledku 3. Sloučit duplicity podle `id`

------------------------------------------------------------------------

## 6. localStorage

Ukládat: - počet nocí - aktivní tagy - stav odškrtnutých položek

Struktura:

``` js
{
  nights: 3,
  tags: ["lan", "abroad"],
  checked: {
    "tshirt": true,
    "passport": false
  }
}
```

Při načtení: - obnovit konfiguraci - znovu vygenerovat checklist -
aplikovat checked stav

------------------------------------------------------------------------

## 7. Ne-funkční požadavky

-   Responsivní (mobile-first)
-   Minimal design
-   Žádné externí knihovny kromě Tailwind CDN
-   Bez build procesu
-   Modulární a čitelný JS

------------------------------------------------------------------------

## 8. Rozšiřitelnost

Aplikace musí umožnit: - Přidání nových tagů bez úpravy JS - Přidání
nových položek bez úpravy JS - Přidání dalších typů qty bez zásahu do UI

------------------------------------------------------------------------

## 9. Scope (MVP)

MVP neobsahuje: - Export do PDF - Sdílení linku - Ukládání více
profilů - Autentizaci - Drag & drop

------------------------------------------------------------------------

## 10. Struktura projektu

    /index.html
    /app.js
    /data.json

Projekt musí fungovat bez build procesu a být připravený pro GitHub
Pages.
