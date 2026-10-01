// True-size helper: show a known-length reference square on the pattern board.
// User matches it to a physical ruler/card on the fabric, then CONFIRM.
// That stores a uniform scale on the pattern lines (1 LS unit = 1 cm at ×1).

import { makeLabel, makePlate, makeTappable, resetLocal, safeDestroy } from "./UiLite";

const SCALE_KEY = "pattern_true_scale_v1";
const INK = new vec4(0.08, 0.08, 0.08, 1);
const CREAM = new vec4(0.96, 0.94, 0.90, 0.92);
const DARK = new vec4(0.08, 0.08, 0.08, 0.94);
const WHITE = new vec4(0.96, 0.94, 0.90, 1);

@component
export class ScaleCalibrator extends BaseScriptComponent {
  @input plateMaterial: Material;
  /** Physical length the square represents (cm). Default: credit-card short side ≈ 5.4; we use 10. */
  @input referenceCm: number = 10;
  /** Object whose local scale is adjusted (PatternRoot / PatternRenderer host). */
  @input
  @allowUndefined
  scaleTarget: SceneObject;
  @input stepPercent: number = 1.5;
  @input minScale: number = 0.85;
  @input maxScale: number = 1.2;

  public onConfirmed: (() => void) | null = null;

  private root: SceneObject | null = null;
  private statusLabel: Text | null = null;
  private scale: number = 1;
  private confirmed: boolean = false;

  onAwake() {
    this.scale = this.loadScale();
    this.applyScale();
  }

  public getScale(): number {
    return this.scale;
  }

  public isConfirmed(): boolean {
    return this.confirmed;
  }

  /** Show the 10 cm square + nudge controls on the board. */
  public begin() {
    this.confirmed = false;
    this.scale = this.loadScale();
    this.applyScale();
    this.buildUi();
    print(
      "ScaleCalibrator: match the " +
        this.referenceCm +
        " cm square to a physical ruler, then CONFIRM (scale×" +
        this.scale.toFixed(3) +
        ")"
    );
  }

  public hide() {
    if (this.root !== null && !isNull(this.root)) {
      safeDestroy(this.root);
      this.root = null;
    }
    this.statusLabel = null;
  }

  private target(): SceneObject {
    if (this.scaleTarget !== undefined && !isNull(this.scaleTarget)) {
      return this.scaleTarget;
    }
    return this.getSceneObject();
  }

  private applyScale() {
    const t = this.target().getTransform();
    t.setLocalScale(new vec3(this.scale, this.scale, this.scale));
  }

  private nudge(dir: number) {
    if (this.confirmed) {
      return;
    }
    const factor = 1 + (this.stepPercent / 100) * dir;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
    this.applyScale();
    this.refreshStatus();
  }

  private confirm() {
    this.confirmed = true;
    this.saveScale(this.scale);
    this.applyScale();
    this.refreshStatus();
    print("ScaleCalibrator: CONFIRMED true-size scale×" + this.scale.toFixed(4));
    if (this.onConfirmed !== null) {
      this.onConfirmed();
    }
    // Keep square visible briefly as proof, then collapse to a small badge.
    this.hide();
    this.showBadge();
  }

  private buildUi() {
    this.hide();
    const host = this.getSceneObject();
    const root = global.scene.createSceneObject("scaleCalibrator");
    root.setParent(host);
    resetLocal(root);
    // Sit above the pattern plane (board is typically -90° X flat).
    root.getTransform().setLocalPosition(new vec3(0, 18, 0.6));
    this.root = root;

    const cm = this.referenceCm;
    const mat = this.plateMaterial;

    // Reference square (true cm at scale 1; grows with pattern scale via parent).
    const frame = global.scene.createSceneObject("refSquare");
    frame.setParent(root);
    resetLocal(frame);
    frame.getTransform().setLocalPosition(new vec3(-16, 0, 0));
    this.drawSquareFrame(frame, cm, mat);

    makeLabel(frame, cm + " cm", 1.1, new vec3(0, -cm * 0.5 - 1.4, 0.2), INK);

    const panel = makePlate(root, "calPanel", 22, 12, this.tint(mat, CREAM));
    panel.getTransform().setLocalPosition(new vec3(10, 0, 0));
    makeLabel(panel, "TRUE SIZE", 0.85, new vec3(0, 4.2, 0.25), INK);
    makeLabel(
      panel,
      "Match square to a ruler",
      0.55,
      new vec3(0, 2.6, 0.25),
      new vec4(0.35, 0.35, 0.35, 1)
    );
    this.statusLabel = makeLabel(panel, "", 0.7, new vec3(0, 0.8, 0.25), INK);

    const minus = this.chip(panel, "−", 4.5, 3.2, () => this.nudge(-1));
    minus.getTransform().setLocalPosition(new vec3(-5.5, -2.2, 0.2));
    const plus = this.chip(panel, "+", 4.5, 3.2, () => this.nudge(1));
    plus.getTransform().setLocalPosition(new vec3(0, -2.2, 0.2));
    const ok = this.chip(panel, "CONFIRM", 7.5, 3.2, () => this.confirm(), true);
    ok.getTransform().setLocalPosition(new vec3(6.2, -2.2, 0.2));

    this.refreshStatus();
  }

  private showBadge() {
    const host = this.getSceneObject();
    const badge = global.scene.createSceneObject("scaleBadge");
    badge.setParent(host);
    resetLocal(badge);
    badge.getTransform().setLocalPosition(new vec3(0, -18, 0.5));
    const plate = makePlate(badge, "badge", 16, 2.4, this.tint(this.plateMaterial, CREAM));
    makeLabel(
      plate,
      "TRUE SIZE ×" + this.scale.toFixed(3) + "  ·  " + this.referenceCm + " cm locked",
      0.55,
      new vec3(0, 0, 0.2),
      INK
    );
    this.root = badge;
  }

  private drawSquareFrame(parent: SceneObject, cm: number, mat: Material) {
    const t = 0.35;
    const half = cm / 2;
    const edges: { n: string; w: number; h: number; x: number; y: number }[] = [
      { n: "top", w: cm, h: t, x: 0, y: half },
      { n: "bot", w: cm, h: t, x: 0, y: -half },
      { n: "left", w: t, h: cm, x: -half, y: 0 },
      { n: "right", w: t, h: cm, x: half, y: 0 }
    ];
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const plate = makePlate(parent, e.n, e.w, e.h, this.tint(mat, DARK));
      plate.getTransform().setLocalPosition(new vec3(e.x, e.y, 0.05));
    }
  }

  private chip(
    parent: SceneObject,
    label: string,
    w: number,
    h: number,
    onTap: () => void,
    primary: boolean = false
  ): SceneObject {
    const color = primary ? DARK : CREAM;
    const ink = primary ? WHITE : INK;
    const plate = makePlate(parent, "chip_" + label, w, h, this.tint(this.plateMaterial, color));
    makeLabel(plate, label, Math.min(h * 0.4, 0.9), new vec3(0, 0, 0.2), ink);
    makeTappable(plate, w, h, onTap);
    return plate;
  }

  private tint(base: Material, color: vec4): Material {
    const m = base.clone();
    m.mainPass.baseColor = color;
    return m;
  }

  private refreshStatus() {
    if (this.statusLabel !== null) {
      this.statusLabel.text = "Scale ×" + this.scale.toFixed(3);
    }
  }

  private loadScale(): number {
    try {
      const raw = global.persistentStorageSystem.store.getString(SCALE_KEY);
      if (raw !== undefined && raw !== null && raw !== "") {
        const n = parseFloat(raw);
        if (!isNaN(n) && n >= this.minScale && n <= this.maxScale) {
          return n;
        }
      }
    } catch (_e) {
      // ignore
    }
    return 1;
  }

  private saveScale(n: number) {
    try {
      global.persistentStorageSystem.store.putString(SCALE_KEY, "" + n);
    } catch (_e) {
      // ignore
    }
  }
}
