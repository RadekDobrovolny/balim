# Packing Checklist

Jednoduchá klientská webová aplikace pro generování checklistu na cestu.

## Stack

- HTML5
- Tailwind CSS (CDN)
- Vanilla JavaScript (ES6)
- `data.json` jako zdroj dat

## Spuštění lokálně

`fetch("./data.json")` vyžaduje HTTP server (neotevírat jen jako `file://`).

```bash
python3 -m http.server 8000
```

Pak otevři `http://localhost:8000`.

## Nasazení na GitHub Pages (bez Actions)

1. Pushni repozitář na GitHub.
2. Otevři `Settings -> Pages`.
3. V části `Build and deployment` nastav:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` (root `/`)
4. Ulož nastavení a počkej na publikaci.
5. Výsledná URL bude ve tvaru:
   `https://<username>.github.io/<repo>/`

## Struktura projektu

- `index.html`
- `app.js`
- `data.json`
- `packing-checklist-prd.md`
