# Pattern Atelier — Snap rejection fix (v2 dressed-humans)

**Policy (active):** Photoreal humans are allowed on plates **only** when fully dressed in modest activewear (crop top + opaque mid-thigh bike shorts / longline tee + opaque knee boxers). No underwear, lingerie, sheer-on-body, or bare back/chest. All UI text/buttons are **native** — never baked into textures.

Canonical build brief: [`FIX_INSTRUCTIONS_FOR_CURSOR.md`](../../FIX_INSTRUCTIONS_FOR_CURSOR.md).

## Live plates (`Assets/UI/Atelier/screen_*.png`)

| Screen | File | Source (Oct 2026) |
|--------|------|-------------------|
| Landing | `screen_landing.png` | S01_landing (v2) |
| Garment | `screen_garment.png` | S02_garments |
| Body | `screen_body.png` | S03_bodyprofile (v2 dressed) |
| Measure | `screen_measure.png` | S04_measurements (v2 dressed + rings) |
| Design | `screen_design.png` | S05_designinput (v2) |
| Generate | `screen_generate.png` | S06_generation (v2) |
| Preview | `screen_preview.png` | S07_preview (v2 hybrid) |
| Fabric | `screen_fabric.png` | S08_tofabric |

Old nude/lingerie mockups must not remain under `Assets/` (package audit). Rejected copies only in `.rejected_screens_backup/` (gitignored).

## Materials

| Material | Role |
|----------|------|
| `UiStickerMat` / `stickerMaterial` | Full-bleed plate board (landing look) |
| **`UiButtonGlass`** / `buttonGlassMaterial` | Native CTA chips only — frosted `#E8E1D4` @ ~42% alpha; solid CTAs use dark glass @ ~78% |

Do not tint button chips from the landing sticker material.

## Resubmit comment

> Rejected for sexual content: all human figures are now fully dressed in modest basic clothing (crop top + bike shorts / T-shirt + boxers); the body-scan screen shows a dressed fit model with floating measurement rings. All previously baked text/buttons removed and rebuilt as native Lens Studio UI. No nudity, no lingerie, no sheer fabric on bodies; background imagery contains no readable text and no revealing figures.
