# PATTERN ATELIER — Snap rejection fix & UI rebuild instructions (v2 — dressed-model policy)

> **Adopted 2026-10-10:** Live project follows this v2 dressed-humans policy. Plates imported into `Assets/UI/Atelier/screen_*.png`. Native CTAs use **`UiButtonGlass`** (`buttonGlassMaterial` on AtelierFace) — not the landing `stickerMaterial`. See `docs/compliance/RESUBMIT_FIX.md`.

For Cursor. Paste into the repo root. All zones are normalized (% of plate; plates are 1264×843, originals 1536×1024 — scale visually).

## 1. Why it was rejected (and the fix policy)

Flagged component: "content that is sexual in nature." Root cause: the full-screen raster mockups used directly as UI contained nude/seminude body renders, underwear-only figures, backless/skin-through-fabric photos and sheer "dress" scans, plus all UI text baked into the images.

**Rules for everything from now on (policy switched from "no humans" to "dressed humans"):**
- R1 — Photorealistic humans ARE allowed on the background plates, but ONLY fully dressed in basic modest activewear-style clothing: women = short-sleeve crop top + high-waisted opaque mid-thigh bike shorts; men = plain longline T-shirt + loose opaque knee-length boxers. No underwear, no lingerie, no sheer fabric, no bare back/chest, no skin visible through fabric. Skin only on face, forearms, hands, feet.
- R2 — Same person across the body screens: the fit-model from S02 (dark top-knot bun, loose strands) appears in S03 and S04 in front/side/back views so the steps read as one session. Garment-only shots elsewhere stay on headless forms.
- R3 — Every plate has ZERO baked text, chips, buttons or panels. Those areas were erased (soft blur-fill "ghost" bands are intentional and acceptable — native panels sit on them). All UI = native Lens Studio components placed into the blank zones.
- R4 — Blank zones in the plates are slots for native UI/overlays. Do not "fill" them back with images; do not re-add text into textures.
- R5 — No background wall photos with real people in revealing clothes (S05/S07 pinned photos were blur-erased). Sketches, croquis drawings and headless-form photos are allowed.

Fix method (NOT a makeover): the exact original images were edited in place — same scene, camera, framing, light and grain; figures re-dressed; all UI erased. No new AI scenes.

## 2. Asset manifest (`assets/restored/` — FINAL set)

| Screen | Original | Final plate | Status | What changed |
|---|---|---|---|---|
| S01 Landing | `Pattern!0.png` | `S01_landing.png` | ✅ | all typography erased; mannequin + pinned patterns kept |
| S02 Garment type | `PatternA6.png` | `S02_garments.png` | ✅ | dressed fit-model trio in oatmeal base layers + gold ring overlay kept; left card numbers/titles, right panel and black chip erased → empty zones |
| S03 Body profile | `PatternA5.png` | `S03_bodyprofile.png` | ✅ | card figures re-dressed: same girl as S02 (crop top + bike shorts, front + profile), man (longline tee + long boxers); third card left empty; right panel + all text erased |
| S04 Measurements | `PatternA4.png` | `S04_measurements.png` | ✅ | scan figure = same girl, crop top + bike shorts, front/profile/back on turntable; gold rings float over clothing; all panels/labels erased |
| S05 Design input | `Pattern!3.png` | `S05_designinput.png` | ✅ | fabric/knot photos + headless gown kept; title/subtitle/stepper, right GARMENT DETAILS panel, hand-lettered annotations (blur-patched — a soft frosted haze sits over the croquis, read it as AR glass, keep that zone free of controls) and wall model-photos erased; pinned sheet label `DRAPE CUT 1` kept as in-scene pattern marking (same policy as S08) |
| S06 Generation | `PatternA2.png` | `S06_generation.png` | ✅ | model in fully opaque draped ivory gown + holo wireframe arcs + floating sheets; ANALYSIS text erased → empty glass card |
| S07 Pattern preview | `PatternA1.png` | `S07_preview.png` | ⚠️ | **hybrid screen** (AI returned a design-input-style scene twice; kept after full text-erase): dressed pencil-sketch croquis + headless-form photos + knot thumbs + empty LOOK card. Usable as-is; the blurred "photo" on the right wall is a soft ghost, native panel covers it. Optional: one more AI pass to convert it to a true preview (keep scene, erase sketch figure's paper, add dress-form render) — not required |
| S08 To fabric | `PatternA7.png` | `S08_tofabric.png` | ✅ | all floating UI erased; glowing in-scene labels `01 FRONT CUT 1 / 02 BACK CUT 1 / 03 SIDE CUT 2 / 04 DRAPE CUT 1` are fabric projections — keep, they are AR content, not UI |

Verified per-file (montage with filenames burned into tiles). Fallback: `assets/fixed/S01..S08.png` = the earlier **no-humans** plates — use only if moderation complains about the dressed figures again; then also switch §1 back to "no people" and drop T16/avatar-free wording accordingly.

Deterministic touch-ups: `python3 scripts/plate_patch.py` batch JSON `[src, dst, [{"box":[x0,y0,x1,y1],"blur":n}]]` (boxes in 1264×843 space; blurfill = median+gauss). Applied jobs live in `scripts/jobs_*.json`. Do NOT over-blur repeatedly — faint ghost bands are accepted.

Extras: `assets/ui/slot_silk.png`, `slot_satin.png`, `slot_toile.png` (320×368 fabric photos) · `assets/ui/overlay_frame.png` (hairline frame + corner marks). The old mannequin `assets/ui/avatars/` set was rejected and deleted — no avatar compositing anywhere.

## 3. Global UI system (build in Lens Studio, once)

- **Fonts (OFL, static TTFs, bundled):** display serif = Cormorant Garamond SemiBold/Bold; technical/labels = IBM Plex Mono Regular/Medium, tracking +10–15%. Never render type inside textures.
- **Tokens:** paper `#EDE6DA` · panel `#E8E1D4` @85% · ink `#15120E` · muted `#7E766B` · hairline `#C8BFAE` · glow-gold `#D9A441` (matches the rings baked on S02/S04) · chip-active `#101010` bg with paper text.
- **Shared prefabs:** `Panel` (9-slice card, hairline border), `Chip` (2-state, label + optional ✕), `SegControl` (3 options, one inverted), `ToggleCard`, `GhostButton`, `SolidButton`, `StepperRail` (rows `01 GARMENT TYPE / DRESS` style; active inverted, past steps tappable, future dim), `ValueRow` (label … value + unit), `LookCard` (title + EDIT + 3 image slots + rows), `ProgressBar` (4 segments: ANALYZING INPUT / GENERATING PATTERN / OPTIMIZING FIT / FINALIZING).
- **Hit rules:** every control = `OnScreenButton`; 20–30 px padding; nothing smaller than ~4% canvas height.
- **Naming:** `S0x_<Component>_<Part>` (e.g. `S05_Chip_Draped`, `S07_Btn_Approve`).
- **Layout:** landscape 16:9 for the demo video; phone submission: plate as Screen Image FILL + paper `#DED6C8` bg, all interactive UI in the center band (avoid top 10% / bottom 18% Snapchat chrome on 9:16).

## 4. Per-screen build spec (native components into the blank zones)

**S01** — title block x4–42% y13–42%: "PATTERN / ATELIER" (display serif) + hairline + "GENERATIVE FASHION SYSTEM" (mono, tracked). Top bar left "SPATIAL ATELIER / FOR MODERN MAKERS", right "AR PATTERN SYSTEM / SPECTACLES". Feature list x7–35% y50–60%. GhostButton "ENTER ATELIER →" x8–37% y64–73%. Footer marks both corners.

**S02** — 5 `LookCard`-lite slots in the left column (image thumbnails are in the plate; numbers/names/sub-lists go into the erased bands), prev/next GhostButtons at row ends, title "SELECT / GARMENT TYPE" in the top zone, and a right `Panel` on the big empty card (selected-garment summary + NEXT). The plate's dressed trio + gold rings = the hero; do not overlay anything on them except an optional name caption.

**S03** — woman/man cards are in the plate. Native: card headers "WOMAN" / "MAN" / (third card) "+ ADD BODY", size `Chip` rows under each card: STANDARD / CURVY / PETITE / TALL (man: ATHLETIC / SLIM / TALL). Tapping a size chip swaps the `ValueRow` presets in the right panel (see T16) — no avatar images, no figure swaps. Right panel on the empty card: `ValueRow`s HEIGHT/BUST/WAIST/HIP + EDIT chips, SUGGESTED SIZE block (large serif "EU 36" + US/UK/IT/FR column), SolidButton "NEXT →".

**S04** — Left: 3 `ToggleCard`s (SCAN BODY / MANUAL INPUT / USE STANDARD SIZE). Center: `ValueRow` cluster HEIGHT 168.0 cm / BUST 88.0 / WAIST 68.0 / HIP 94.0 with thin leader lines to the baked gold rings (ring center ≈ x 500/1264). Right: MEASUREMENTS `Panel` + per-point `ValueRow`s + CONFIRM `SolidButton`. Scan animation = a gold `Image` scanline sweeping the figure + rings pulse (additive blend); never reveal a body mesh or skin.

**S05** — Title zone: "DESIGN / YOUR PIECE" + "DESCRIBE THE GARMENT YOU WANT TO CREATE" over the erased top band. Right `Panel` "GARMENT DETAILS" + CLEAR ALL on the empty card zone; `SegControl` SILHOUETTE (FITTED/REGULAR/OVERSIZED) + LENGTH (MINI/MIDI/MAXI); FABRIC row (slot thumb + name + chevron); DETAILS `Chip` row (DRAPED ✕ / ASYMMETRIC ✕ / OPEN BACK ✕ / SLIT ✕ / + ADD DETAIL — note: "OPEN BACK" is a garment spec string, allowed; nothing shows skin); text field + live "0/300"; GhostButton TYPE + SolidButton VOICE.

**S06** — plate kept as-is (gown + holo arcs + floating sheets). Overlays: extra floating pattern-paper PNGs (±8 px y-drift loop), node-dot particles, progress `ProgressBar` bottom. Right: `Panel_AIStyling` (§5) on the empty glass card.

**S07** — Left: 2 photo slots FRONT VIEW / SIDE VIEW using fabric/form crops (`assets/ui/slot_*`), label above each. Center: `overlay_frame.png` around the sketch-render zone + mono callout `Text`s (asymmetric drape, side knot). Right `LookCard` on the empty card: LOOK 001 + EDIT + 3 fabric thumbs, PATTERN INFO `ValueRow`s, 4 MODIFY `Chip`s, SolidButton APPROVE PATTERN →, GhostButton REGENERATE ↻.

**S08** — Left: `StepperRail` (active = 08 TO FABRIC). Header pair "TO FABRIC / YOUR PATTERN IN REAL SPACE". `FABRIC DETECTED` card (slot thumb + 4 lines + CHANGE FABRIC →). `LAYOUT OPTIMIZATION` panel: 87% ring gauge (static PNG arc + Text), TOTAL PIECES 4 / FABRIC WIDTH 148 cm / EST. USE 1.8 m / EFFICIENCY 87%. `PIECE INFO` panel: thumb, SEAM ALLOWANCE 1.0 cm, GRAINLINE ←→, LENGTH/WIDTH, NEXT PIECE (Solid), VIEW ALL PIECES (Ghost). The glowing 01–04 labels on the fabric stay baked (in-scene AR).

## 5. `Panel_AIStyling` (shared, 4 states — never images, only Text/chips)

- **PARSE (S05):** live-parsed tags: `SILHOUETTE: draped` `HEM: asymmetric` `OPEN BACK: yes` `FABRIC: silk satin (lightweight)` `CONFIDENCE ▮▮▮▮▯ 82%`; updates per keystroke; VOICE(SIM) types into it.
- **ANALYZE (S06):** SILHOUETTE ANALYSIS ✓ "Draped / Asymmetric" · FIT ADAPTATION ✓ "Based on your measurements" · SEAM ALLOWANCE ✓ "Added (1.0 cm)" · FABRIC BEHAVIOUR ◌ "Silk Satin (lightweight)" · PATTERN GEOMETRY ◌ "Optimizing pieces…" + MATERIAL REFERENCE sub-card (slot thumb + line).
- **SUGGEST (S07):** 3 rows with APPLY/IGNORE: "Lower slit 4 cm — print alignment" · "Stay tape at shoulder seam −1 mm" · "Rotate side panel: waste −6%". APPLY writes state + bumps REGENERATE flag.
- **LAYOUT (S08):** "Mirror pieces 01/02 to save 0.2 m" · "Grainline conflict on 04 — resolved".

## 6. Known issues / deferred fixes (demo-video aware)

| # | Prio | Issue | Fix | Done when |
|---|---|---|---|---|
| T1 | ✅ DONE | S02–S07 figures re-dressed to policy; S03/S04 unified to the S02 girl (crop top + bike shorts; man in tee + boxers) | — | verified per-file montage |
| T2 | ✅ DONE | S05 title/subtitle/stepper/hand-lettering + wall model-photos erased | native title goes in that zone | no readable text / no model photos in plate |
| T3 | ✅ DONE | S06 ANALYSIS text erased → empty glass card | native `Panel_AIStyling` replaces it | glass card empty on plate |
| T4 | **BLOCKER** | Original violating mockups (`uploads/*.png` sources) still referenced in the project | delete from Lens Studio assets AND scene references — package audit sees hidden textures | no old texture in package |
| T5 | HIGH | Chips/segments decorative | 2-state `Chip` prefabs; selection index in state; selected = ink bg/paper text | tapping toggles visuals + state |
| T6 | HIGH | StepperRail static | tap navigates to *visited* steps only; future dim, no-op | back-nav works |
| T7 | HIGH | VOICE implies live ASR | keep behavior (simulated typing) and/or label `VOICE (SIM)` | no non-functional affordance |
| T8 | MED | "0/300" counter fake | bind to input char count | counter updates |
| T9 | MED | CHANGE FABRIC → dead | FABRIC picker overlay (3 slots); tap sets FABRIC row + thumbs | flow works |
| T10 | MED | Mockup serif ≈ licensed typeface | bundle OFL only (Cormorant Garamond, IBM Plex Mono) | license-safe |
| T11 | MED | Texture budget: 8 plates | export ≤2048 px JPG q80 (≤1 MB each); PNG-32 only for overlays; check Lens submit-dialog cap | package well under limit |
| T12 | MED | 9:16 safe areas | controls in center band (avoid top 10%, bottom 18% chrome) | verified on device |
| T13 | HIGH | S07 thumbnails + LOOK-card images | fabric-only slots; the sketch croquis (pencil drawing, modest dress) is allowed — if moderation tightens on drawings, cover center with `overlay_frame` + pattern-sheet crop | zero photoreal people in any thumbnail |
| T14 | ✅ DONE | Wall art / bokeh with figures swept across plates (S05/S07 pinned photos blurred) | — | visual pass per screen done; re-check after any regluing |
| T15 | LOW | README says "images used directly as UI" | replace with this spec; note the switch date to native UI | README accurate |
| T16 | MED | S03 size list is decorative | size chips swap the `ValueRow` presets + right-panel SUGGESTED SIZE (e.g. Petite −4 cm height, CURVY bust +6) — plate figures stay static (fix, not makeover) | every chip changes the numbers |
| T17 | LOW | S07 is a hybrid screen; blur ghosts visible in large text zones | acceptable (native panels cover). Optional single AI pass or swap to `assets/fixed/S07.png` + own overlay if preview flow must be exact | — |

## 7. Compliance sweep before resubmit

1. Play all 8 screens; screenshot each; inspect thumbnails + backgrounds at 100%: humans only where dressed per §1; zero underwear/sheer/bare back; zero readable text inside plates (except S08 in-scene AR labels); soft blur ghosts OK.
2. Project search for old texture filenames (`uploads/*`, `Pattern*`); delete all (T4).
3. Every visible control works or is explicitly `(SIM)`.
4. Fonts bundled, OFL, no baked type.
5. Resubmit note: "Rejected for sexual content: all human figures are now fully dressed in modest basic clothing (crop top + bike shorts / T-shirt + boxers); the body-scan screen shows a dressed fit model with floating measurement rings. All previously baked text/buttons removed and rebuilt as native Lens Studio UI. No nudity, no lingerie, no sheer fabric on bodies; background imagery contains no readable text and no revealing figures."
