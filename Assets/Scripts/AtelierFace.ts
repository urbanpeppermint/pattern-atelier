// Full-bleed atelier UI face: each step is a mockup texture board with
// transparent tap hotspots. Language is NOT a screen — use LangDropdown.

import { makeLabel, makeSticker, makeTappable, resetLocal, safeDestroy } from "./UiLite";

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
  @input stickerMaterial: Material;
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

    if (id === "design" && this.hits !== null) {
      const confirm = makeLabel(this.hits, "CONFIRM", 1.35, new vec3((0.75 - 0.5) * w, (0.11 - 0.5) * h, 1.0), new vec4(0.1, 0.1, 0.1, 1));
      confirm.renderOrder = 120;
      makeTappable(confirm.getSceneObject(), 18, 3.6, () => {
        print("AtelierFace: tap confirm");
        if (this.onHotspot !== null) {
          this.onHotspot("confirm");
        }
      });
    }
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

/** Hotspot maps aligned to the editorial mockups (normalized 0–1). */
export const HOTSPOTS: { [id: string]: Hotspot[] } = {
  landing: [{ id: "enter", nx: 0.22, ny: 0.30, nw: 0.28, nh: 0.10 }],
  garment: [
    { id: "back", nx: 0.04, ny: 0.46, nw: 0.08, nh: 0.16 },
    { id: "next", nx: 0.62, ny: 0.46, nw: 0.06, nh: 0.12 },
    { id: "card0", nx: 0.15, ny: 0.46, nw: 0.10, nh: 0.50 },
    { id: "card1", nx: 0.25, ny: 0.46, nw: 0.10, nh: 0.50 },
    { id: "card2", nx: 0.35, ny: 0.46, nw: 0.10, nh: 0.50 },
    { id: "card3", nx: 0.45, ny: 0.46, nw: 0.10, nh: 0.50 },
    { id: "card4", nx: 0.55, ny: 0.46, nw: 0.10, nh: 0.50 }
  ],
  body: [
    { id: "back", nx: 0.04, ny: 0.48, nw: 0.08, nh: 0.16 },
    { id: "woman", nx: 0.22, ny: 0.48, nw: 0.16, nh: 0.46 },
    { id: "man", nx: 0.40, ny: 0.48, nw: 0.16, nh: 0.46 },
    { id: "confirm", nx: 0.52, ny: 0.20, nw: 0.28, nh: 0.14 }
  ],
  measure: [
    { id: "scan", nx: 0.12, ny: 0.58, nw: 0.16, nh: 0.10 },
    { id: "manual", nx: 0.12, ny: 0.46, nw: 0.16, nh: 0.10 },
    { id: "standard", nx: 0.12, ny: 0.34, nw: 0.16, nh: 0.10 },
    { id: "confirm", nx: 0.810, ny: 0.359, nw: 0.18, nh: 0.07 },
    { id: "back", nx: 0.12, ny: 0.20, nw: 0.16, nh: 0.08 }
  ],
  design: [
    { id: "back", nx: 0.10, ny: 0.22, nw: 0.14, nh: 0.08 },
    { id: "sil_fitted", nx: 0.652, ny: 0.692, nw: 0.08, nh: 0.04 },
    { id: "sil_regular", nx: 0.746, ny: 0.692, nw: 0.08, nh: 0.04 },
    { id: "sil_oversized", nx: 0.819, ny: 0.692, nw: 0.08, nh: 0.04 },
    { id: "len_mini", nx: 0.661, ny: 0.620, nw: 0.08, nh: 0.04 },
    { id: "len_midi", nx: 0.746, ny: 0.620, nw: 0.08, nh: 0.04 },
    { id: "len_maxi", nx: 0.818, ny: 0.620, nw: 0.08, nh: 0.04 },
    { id: "fabric", nx: 0.70, ny: 0.53, nw: 0.22, nh: 0.06 },
    { id: "det_draped", nx: 0.62, ny: 0.431, nw: 0.08, nh: 0.04 },
    { id: "det_asymmetric", nx: 0.70, ny: 0.431, nw: 0.09, nh: 0.04 },
    { id: "det_open", nx: 0.772, ny: 0.431, nw: 0.09, nh: 0.04 },
    { id: "det_slit", nx: 0.65, ny: 0.370, nw: 0.08, nh: 0.04 },
    { id: "det_add", nx: 0.73, ny: 0.370, nw: 0.10, nh: 0.04 },
    { id: "type", nx: 0.689, ny: 0.199, nw: 0.13, nh: 0.07 },
    { id: "voice", nx: 0.827, ny: 0.199, nw: 0.13, nh: 0.07 }
  ],
  generate: [],
  preview: [
    { id: "approve", nx: 0.839, ny: 0.213, nw: 0.19, nh: 0.06 },
    { id: "back", nx: 0.10, ny: 0.22, nw: 0.14, nh: 0.08 }
  ],
  fabric: [
    { id: "nextPiece", nx: 0.904, ny: 0.232, nw: 0.15, nh: 0.07 },
    { id: "back", nx: 0.10, ny: 0.24, nw: 0.14, nh: 0.08 }
  ]
};
