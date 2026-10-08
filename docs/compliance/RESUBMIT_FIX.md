# Pattern Atelier — Snap rejection fix policy

**Date:** 2026-10-09  
**Flag:** “content that is sexual in nature”  
**Root cause:** full-screen **raster mockups used as UI** contained photorealistic bodies / underwear / backless-dress photos / sheer-on-body / figure wall art.

**2026-10-09 update:** Live `Assets/UI/Atelier/screen_*.png` were replaced with publication-safe plates (figures / baked sexual-content UI erased). `AtelierFace` draws native titles + CTA chips over blank zones. Old violating rasters live only under `.rejected_screens_backup/` (gitignored, outside the Lens package).

---

## Rules (everything from now on)

| # | Rule |
|---|------|
| **R1** | No human figures anywhere: no faces, no bodies — not in thumbnails, wall art, bokeh, or sketches. |
| **R2** | Garments only on headless dress forms, invisible/ghost mannequins, or flat-lay. |
| **R3** | No sheer fabric on a form; no underwear; no visible skin. |
| **R4** | No baked UI (text / buttons / chips / panels) inside background images. All UI = native Lens Studio components. |
| **R5** | Blank zones in plates are intentional slots for native UI. Do not fill them with more image content. |

Fix method: repair the **original** photo in place (delete people, restore wall/fabric). Same framing, light, grain — not a redesign.

---

## Asset status (`Assets/UI/Atelier/fixed/`)

| Screen | File | Status | Notes |
|--------|------|--------|-------|
| S01 Landing | `S01_landing.png` | ✅ clean | blank left slot for title + ENTER |
| S02 Garment | `S02_garments.png` | ✅ clean | 5 garment image slots; no labels |
| S03 Body | `S03_bodyprofile.png` | ✅ clean | empty frames; no nude cards |
| S04 Measure | `S04_measurements.png` | ⏳ **T1 regen** | figure + baked UI still present |
| S05 Design | `S05_designinput.png` | ⚠ **T2** | people cleared; serif title / glass panel still baked |
| S06 Generate | `S06_generation.png` | ⚠ **T3** | dress form OK; ANALYSIS text block still baked |
| S07 Preview | `S07_preview.png` | ⏳ **T1 regen** | woman + baked UI still present |
| S08 Fabric | `S08_tofabric.png` | ⚠ **T14** | AR cut labels OK; wall fashion figures still visible |

Old live textures (must leave package before resubmit — **T4**):

```text
Assets/UI/Atelier/screen_landing.png
Assets/UI/Atelier/screen_garment.png
Assets/UI/Atelier/screen_body.png
Assets/UI/Atelier/screen_measure.png
Assets/UI/Atelier/screen_design.png
Assets/UI/Atelier/screen_generate.png
Assets/UI/Atelier/screen_preview.png
Assets/UI/Atelier/screen_fabric.png
```

---

## Architecture change (required for resubmit)

**Before:** editorial PNG = entire UI (hotspots on baked buttons).  
**After:** clean plate + native components (Panel / Chip / SolidButton / GhostButton / StepperRail / Panel_AIStyling).

Fonts (OFL only): Cormorant Garamond (display), IBM Plex Mono (labels).  
Tokens: paper `#EDE6DA` · panel `#E8E1D4` @85% · ink `#15120E` · muted `#7E766B` · hairline `#C8BFAE` · glow-gold `#D9A441`.

Per-screen native placement and `Panel_AIStyling` states: see the build brief in chat / Arena (S01–S08 + PARSE/ANALYZE/SUGGEST/LAYOUT).

---

## Blocker checklist before upload

| # | Issue | Done when |
|---|-------|-----------|
| T1 | S04 + S07 regen | no figures, no baked text |
| T2 | S05 erase title + glass | plate has empty slots only |
| T3 | S06 erase ANALYSIS block | plate empty where native panel sits |
| T4 | Delete old `screen_*.png` from project + scene refs | package audit finds none |
| T13/T14 | S07 thumbs + all wall figures | zero people anywhere |
| T5–T9 | Controls work or labeled `(SIM)` | no dead affordances |
| T10 | OFL fonts bundled | no licensed raster type |
| T11 | Plates ≤2048 JPG q80 | under Lens size cap |
| T12 | 9:16 safe band | controls outside Snap chrome |

---

## Resubmit comment (paste)

> Rejected for sexual content: all human figures have been removed. Garments now shown only on dress forms / flat-lay fabric; body-scan screen uses an abstract dress-form with floating measurement rings, no human body. All UI rebuilt as native components; background plates contain no people and no baked text.

---

## Do not do yet

- Do **not** point `AtelierFace` at `fixed/*.png` until S04/S07 are clean **and** native UI is placed on blank zones — blank plates alone break the wearable demo.
- Do **not** reintroduce model photos “just for the moodboard.”
