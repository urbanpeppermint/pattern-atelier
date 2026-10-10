// Full-bleed atelier UI face: v2 dressed-human plates + native labels/CTAs
// over blank zones. Text is never baked into textures.
// Landing board uses stickerMaterial; interactive chips use buttonGlassMaterial.

import { makeLabel, makePlate, makeSticker, makeTappable, resetLocal, safeDestroy } from "./UiLite";

const INK = new vec4(0.08, 0.07, 0.05, 1);
const MUTED = new vec4(0.49, 0.46, 0.42, 1);
/** Frosted chip fill (matches UiButtonGlass default). */
const GLASS = new vec4(0.91, 0.882, 0.831, 0.42);
const GLASS_SOLID = new vec4(0.08, 0.07, 0.05, 0.78);
const WHITE = new vec4(0.96, 0.94, 0.90, 1);

export type AtelierScreenId =
  | "landing"
  | "garment"
  | "body"
  | "measure"
  | "design"
  | "generate"
  | "preview"
  | "fabric";

export interface Hotspot {
  id: string;
  // Normalized coords: 0..1 from board left/bottom, size as fraction of board.
  nx: number;
  ny: number;
  nw: number;
  nh: number;
}

@component
export class AtelierFace extends BaseScriptComponent {
  /** Opaque / textured plate for the full-bleed screen board (landing look). */
  @input stickerMaterial: Material;
  /** Semi-glass for native CTA chips — distinct from landing sticker. */
  @input
  @allowUndefined
  buttonGlassMaterial: Material;
  @input
  @allowUndefined
  boardWidthCm: number = 58;

  @input
  @allowUndefined
  screenLanding: Texture;
  @input
  @allowUndefined
  screenGarment: Texture;
  @input
  @allowUndefined
  screenBody: Texture;
  @input
  @allowUndefined
  screenMeasure: Texture;
  @input
  @allowUndefined
  screenDesign: Texture;
  @input
  @allowUndefined
  screenGenerate: Texture;
  @input
  @allowUndefined
  screenPreview: Texture;
  @input
  @allowUndefined
  screenFabric: Texture;

  public onHotspot: ((id: string) => void) | null = null;

  private root: SceneObject | null = null;
  private board: SceneObject | null = null;
  private hits: SceneObject | null = null;
  private current: AtelierScreenId | null = null;
  private caption: Text | null = null;
  private queued: { id: AtelierScreenId; hotspots: Hotspot[] } | null = null;
  private applyScheduled: boolean = false;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => {
      this.root = global.scene.createSceneObject("atelierFaceRoot");
      this.root.setParent(this.sceneObject);
      resetLocal(this.root);
      // Visibility is owned by AppFlow — do not hide here (race with enterLanding).
    });
  }

  private texFor(id: AtelierScreenId): Texture | null {
    if (id === "landing") return this.orNull(this.screenLanding);
    if (id === "garment") return this.orNull(this.screenGarment);
    if (id === "body") return this.orNull(this.screenBody);
    if (id === "measure") return this.orNull(this.screenMeasure);
    if (id === "design") return this.orNull(this.screenDesign);
    if (id === "generate") return this.orNull(this.screenGenerate);
    if (id === "preview") return this.orNull(this.screenPreview);
    if (id === "fabric") return this.orNull(this.screenFabric);
    return null;
  }

  private orNull(t: Texture | undefined): Texture | null {
    if (t === undefined || isNull(t)) {
      return null;
    }
    return t;
  }

  show(id: AtelierScreenId, hotspots: Hotspot[]) {
    // Rebuild on the next frame. Destroying the hotspot that just fired
    // leaves SIK unable to target the buttons on the following screen.
    this.queued = { id: id, hotspots: hotspots };
    if (this.applyScheduled) {
      return;
    }
    this.applyScheduled = true;
    const evt = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
    evt.bind(() => {
      this.applyScheduled = false;
      const next = this.queued;
      this.queued = null;
      if (next !== null) {
        this.applyShow(next.id, next.hotspots);
      }
    });
    evt.reset(0.05);
  }

  private applyShow(id: AtelierScreenId, hotspots: Hotspot[]) {
    this.current = id;
    this.sceneObject.enabled = true;
    if (this.root === null || isNull(this.root)) {
      this.root = global.scene.createSceneObject("atelierFaceRoot");
      this.root.setParent(this.sceneObject);
      resetLocal(this.root);
    }
    if (this.board !== null && !isNull(this.board)) {
      safeDestroy(this.board);
      this.board = null;
    }
    if (this.hits !== null && !isNull(this.hits)) {
      safeDestroy(this.hits);
      this.hits = null;
    }
    this.caption = null;

    const tex = this.texFor(id);
    const w = this.boardWidthCm;
    if (tex !== null) {
      this.board = makeSticker(this.root, "screen_" + id, this.stickerMaterial, tex, w);
      this.board.getTransform().setLocalPosition(new vec3(0, 0, 0));
      const rmv = this.board.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      if (rmv !== null && !isNull(rmv)) {
        rmv.renderOrder = 20;
      }
    } else {
      // Fallback plate if texture not wired yet
      print("AtelierFace: missing texture for " + id);
      this.caption = makeLabel(this.root, id.toUpperCase(), 2.0, new vec3(0, 0, 0.2));
    }

    this.hits = global.scene.createSceneObject("hits");
    this.hits.setParent(this.root);
    resetLocal(this.hits);

    const aspect =
      tex !== null ? tex.getHeight() / tex.getWidth() : 9 / 16;
    const h = w * aspect;

    for (let i = 0; i < hotspots.length; i++) {
      const hs = hotspots[i];
      const hw = Math.max(hs.nw * w, 2);
      const hh = Math.max(hs.nh * h, 2);
      // nx/ny = center of hotspot in 0..1 from bottom-left
      const x = (hs.nx - 0.5) * w;
      const y = (hs.ny - 0.5) * h;
      const hit = global.scene.createSceneObject("hit_" + hs.id);
      hit.setParent(this.hits);
      resetLocal(hit);
      hit.getTransform().setLocalPosition(new vec3(x, y, 0.4));
      const hid = hs.id;
      makeTappable(hit, hw, hh, () => {
        print("AtelierFace: tap " + hid);
        if (this.onHotspot !== null) {
          this.onHotspot(hid);
        }
      });
    }

    this.addNativeChrome(id, w, h);
  }

  private chipMaterial(): Material {
    if (this.buttonGlassMaterial !== undefined && !isNull(this.buttonGlassMaterial)) {
      return this.buttonGlassMaterial;
    }
    return this.stickerMaterial;
  }

  /** Titles + CTA chips drawn in Lens (not in the plate texture). */
  private addNativeChrome(id: AtelierScreenId, w: number, h: number) {
    if (this.hits === null) {
      return;
    }
    const host = this.hits;
    const glass = this.chipMaterial();

    const title = (text: string, nx: number, ny: number, size: number) => {
      const t = makeLabel(host, text, size, new vec3((nx - 0.5) * w, (ny - 0.5) * h, 0.9), INK);
      t.renderOrder = 130;
      return t;
    };
    const sub = (text: string, nx: number, ny: number) => {
      const t = makeLabel(host, text, 0.7, new vec3((nx - 0.5) * w, (ny - 0.5) * h, 0.9), MUTED);
      t.renderOrder = 130;
      return t;
    };
    const chip = (label: string, nx: number, ny: number, ww: number, hh: number, hid: string, solid: boolean) => {
      const color = solid ? GLASS_SOLID : GLASS;
      const ink = solid ? WHITE : INK;
      const plate = makePlate(host, "chip_" + hid, ww, hh, this.tint(glass, color));
      plate.getTransform().setLocalPosition(new vec3((nx - 0.5) * w, (ny - 0.5) * h, 0.85));
      const rmv = plate.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
      if (rmv !== null && !isNull(rmv)) {
        rmv.renderOrder = 125;
      }
      const t = makeLabel(plate, label, Math.min(hh * 0.38, 1.1), new vec3(0, 0, 0.25), ink);
      t.renderOrder = 140;
      makeTappable(plate, ww + 1, hh + 1, () => {
        print("AtelierFace: tap " + hid);
        if (this.onHotspot !== null) {
          this.onHotspot(hid);
        }
      });
    };

    if (id === "landing") {
      title("PATTERN ATELIER", 0.24, 0.72, 1.8);
      sub("GENERATIVE FASHION SYSTEM", 0.24, 0.64);
      sub("AI PATTERN  ·  PERSONALIZED FIT  ·  SPATIAL PROJECTION", 0.24, 0.52);
      chip("ENTER ATELIER →", 0.24, 0.32, 18, 3.4, "enter", true);
    } else if (id === "garment") {
      title("SELECT GARMENT TYPE", 0.28, 0.86, 1.4);
      const names = ["TOP", "DRESS", "TROUSERS", "SKIRT", "JACKET"];
      const xs = [0.15, 0.25, 0.35, 0.45, 0.55];
      for (let i = 0; i < names.length; i++) {
        chip(names[i], xs[i], 0.18, 8, 2.4, "card" + i, false);
      }
      chip("←", 0.04, 0.46, 4, 3, "back", false);
    } else if (id === "body") {
      title("BODY PROFILE", 0.28, 0.86, 1.4);
      chip("WOMAN", 0.22, 0.48, 10, 4, "woman", false);
      chip("MAN", 0.40, 0.48, 10, 4, "man", false);
      chip("NEXT →", 0.70, 0.22, 12, 3.2, "confirm", true);
      chip("← BACK", 0.10, 0.22, 8, 2.8, "back", false);
    } else if (id === "measure") {
      title("MEASUREMENTS", 0.28, 0.88, 1.3);
      chip("01 SCAN BODY", 0.14, 0.62, 14, 3, "scan", false);
      chip("02 MANUAL INPUT", 0.14, 0.50, 14, 3, "manual", false);
      chip("03 STANDARD SIZE", 0.14, 0.38, 14, 3, "standard", false);
      chip("CONFIRM →", 0.82, 0.28, 12, 3.2, "confirm", true);
      chip("← BACK", 0.14, 0.22, 8, 2.6, "back", false);
    } else if (id === "design") {
      title("DESIGN YOUR PIECE", 0.28, 0.88, 1.35);
      sub("DESCRIBE THE GARMENT YOU WANT TO CREATE", 0.28, 0.80);
      chip("FITTED", 0.652, 0.72, 6, 2.2, "sil_fitted", false);
      chip("REGULAR", 0.746, 0.72, 6.5, 2.2, "sil_regular", false);
      chip("OVERSIZED", 0.83, 0.72, 7, 2.2, "sil_oversized", false);
      chip("MINI", 0.66, 0.62, 5.5, 2.2, "len_mini", false);
      chip("MIDI", 0.746, 0.62, 5.5, 2.2, "len_midi", false);
      chip("MAXI", 0.83, 0.62, 5.5, 2.2, "len_maxi", false);
      chip("DRAPED", 0.62, 0.45, 6, 2.1, "det_draped", false);
      chip("ASYMMETRIC", 0.72, 0.45, 7.5, 2.1, "det_asymmetric", false);
      chip("OPEN BACK", 0.84, 0.45, 7, 2.1, "det_open", false);
      chip("CONFIRM →", 0.78, 0.14, 12, 3.2, "confirm", true);
      chip("← BACK", 0.12, 0.18, 8, 2.6, "back", false);
    } else if (id === "generate") {
      title("GENERATING PATTERN", 0.40, 0.88, 1.3);
      sub("ANALYZING  ·  DRAFTING  ·  OPTIMIZING FIT", 0.40, 0.78);
    } else if (id === "preview") {
      title("PATTERN PREVIEW", 0.30, 0.88, 1.4);
      sub("YOUR DESIGN IS READY", 0.30, 0.80);
      chip("APPROVE PATTERN →", 0.78, 0.22, 16, 3.4, "approve", true);
      chip("← BACK", 0.12, 0.22, 8, 2.6, "back", false);
    } else if (id === "fabric") {
      title("TO FABRIC", 0.28, 0.88, 1.35);
      sub("YOUR PATTERN IN REAL SPACE", 0.28, 0.80);
      chip("NEXT PIECE →", 0.84, 0.22, 12, 3.0, "nextPiece", true);
      chip("← BACK", 0.12, 0.22, 8, 2.6, "back", false);
    }
  }

  private tint(base: Material, color: vec4): Material {
    const m = base.clone();
    m.mainPass.baseColor = color;
    return m;
  }

  hide() {
    this.current = null;
    this.sceneObject.enabled = false;
    if (this.board !== null && !isNull(this.board)) {
      safeDestroy(this.board);
      this.board = null;
    }
    if (this.hits !== null && !isNull(this.hits)) {
      safeDestroy(this.hits);
      this.hits = null;
    }
  }

  getCurrent(): AtelierScreenId | null {
    return this.current;
  }
}

/** Hotspots for demo flow. Native chips also fire the same ids. */
export const HOTSPOTS: { [id: string]: Hotspot[] } = {
  // Empty: landing ENTER is a native chip only (avoids double-fire).
  landing: [],
  garment: [
    { id: "card0", nx: 0.15, ny: 0.55, nw: 0.12, nh: 0.45 },
    { id: "card1", nx: 0.30, ny: 0.55, nw: 0.12, nh: 0.45 },
    { id: "card2", nx: 0.45, ny: 0.55, nw: 0.12, nh: 0.45 },
    { id: "card3", nx: 0.60, ny: 0.55, nw: 0.12, nh: 0.45 },
    { id: "card4", nx: 0.75, ny: 0.55, nw: 0.12, nh: 0.45 }
  ],
  body: [],
  measure: [],
  design: [],
  generate: [],
  preview: [],
  fabric: []
};
