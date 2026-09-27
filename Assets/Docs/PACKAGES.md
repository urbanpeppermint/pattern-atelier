# Packages to Install — PatternAtelier_5.15 (Lens Studio 5.15.0)

Install **only** from the **5.15 Asset Library** (Window → Asset Library).  
Do **not** copy `.lspkg` files from the 5.23 `Pattern Fashion AI` project.

Pinned versions below match your working **P4L-Lens-OnDevice-5.15** project on the same Studio build (`5.15.0.25101318`).

---

## Required (demo MVP)

| # | Package name in Asset Library | Exact version | Why |
|---|------------------------------|---------------|-----|
| 1 | **Spectacles Interaction Kit** (SIK) | **0.15.0** | Pinch/Interactable, cursors, manipulators, handle |
| 2 | **Remote Service Gateway** | **1.0.1** | OpenAI TTS (`OpenAI.speech`), optional PatternAI chat |
| 3 | **Spectacles UI Kit** | *version that depends on SIK 0.15.0* | Optional for this demo (we use custom quads). Install only if Asset Library offers a 5.15 build that lists SIK **0.15.0** as dependency — same as P4L |

**Minimum for a surface demo:** **SIK 0.15.0** alone can show boards + patterns.  
**For assistant voice / AI:** add **Remote Service Gateway 1.0.1**.

### Install order
1. Spectacles Interaction Kit **0.15.0**
2. Remote Service Gateway **1.0.1**
3. Spectacles UI Kit (optional; must resolve against SIK 0.15.0)

After install, Preview should log something like: `SIK Version : 0.15.0`

---

## Do NOT install for the demo

| Package | Reason |
|---------|--------|
| Leaf / LEAF | Testing only; not needed for video |
| Bitmoji 3D | Unused in Pattern Atelier demo |
| AiPreviewAgentInspect / Interact | CLAD/preview agents — 5.23 era |
| SnapDecorators / Utilities from 5.23 | Not required by demo scripts |
| Any SIK **0.18.x** | That is the **5.23** line — wrong for 5.15 |

---

## How to pick the version in Asset Library

1. Open **Lens Studio 2.app** (5.15.0) → project `PatternAtelier_5.15`
2. **Window → Asset Library**
3. Search each name above
4. Open the package detail → choose version **0.15.0** / **1.0.1** if a version dropdown exists  
   - If only “Install” appears, 5.15 usually installs the **compatible** train (should be 0.15.x / 1.0.x)
5. Confirm under `Packages/` you see:
   ```text
   SpectaclesInteractionKit.lspkg
   RemoteServiceGateway.lspkg
   SpectaclesUIKit.lspkg   (optional)
   ```

### If the Library only shows a newer SIK (e.g. 0.16+)
Prefer the highest version that **lists 5.15 / Spectacles 2024** compatibility.  
If unsure, copy packages from your known-good project:

```text
/Users/elsafz/Documents/P4L-Lens-OnDevice-5.15/Packages/
  SpectaclesInteractionKit.lspkg   → SIK 0.15.0
  RemoteServiceGateway.lspkg       → RSG 1.0.1
  SpectaclesUIKit.lspkg            → depends on SIK 0.15.0
```

Copying `.lspkg` **between two 5.15 projects** is OK.  
Copying from **5.23 Pattern Fashion AI** is **not** OK.

---

## Template / platform check (important)

Your new `PatternAtelier_5.15.esproj` currently looks like a **Default / Mobile** template. For Specs 2024 you want:

- **lensClientCompatibilities: Spectacles**
- Prefer creating from **Spectacles** or **AI Playground** template (as in P4L), not Default Mobile

In Project Settings / Lens Info, set applicability to **Spectacles** before Send to Spectacles.

Also add the SIK **Interaction Manager / Orthographic Camera** setup from the SIK example prefab (same as any Spectacles template).

---

## After packages: scene starter

1. Drag **SIK** example “place in scene” prefab if provided (Interaction Manager).
2. Create `RemoteServiceGatewayCredentials` from RSG examples; paste tokens yourself.
3. Import art from `docs/5.15-demo/assets-to-copy/`.
4. Continue with `WINDOW_B_5.15_ONDEVICE.md` prompts.

---

## Contrast with this 5.23 reference project

| Package | Pattern Fashion AI (5.23) | PatternAtelier_5.15 |
|---------|---------------------------|--------------------|
| SIK | **0.18.0** | **0.15.0** |
| RSG | (newer train) | **1.0.1** |
| UI Kit | pairs with SIK 0.18 | pairs with SIK **0.15.0** |
