// Nivelador del tablero: se queda horizontal y, en Spectacles, se apoya
// en la superficie real debajo al soltar la manija.
//
// 5.15 World Query matches this call shape:
//   require("LensStudio:WorldQueryModule") as WorldQueryModule
//   createHitTestSession() / start() / hitTest(start, end, cb)
// The callback can be null when the ray misses. Editor preview has no session.

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";

@component
export class BoardLeveler extends BaseScriptComponent {
  @input levelSpeed: number = 10;
  @input snapToSurface: boolean = true;
  @input surfaceOffsetCm: number = 1;
  @input
  @allowUndefined
  handle: Interactable;

  private hitSession: HitTestSession | null = null;
  private rayBusy: boolean = false;
  private held: boolean = false;
  private targetY: number | null = null;
  private snapArmed: boolean = false;
  private posed: boolean = false;
  private locked: boolean = false;

  /** Surface follow waits until the place-on-surface tap. */
  public setSnapArmed(on: boolean) {
    if (this.locked) {
      return;
    }
    this.snapArmed = on;
    if (!on) {
      this.targetY = null;
    }
  }

  /** After placement, keep the sheet on the surface. Rotation stays as the user left it. */
  public releaseToUser() {
    if (this.locked) {
      return;
    }
    this.posed = true;
    this.snapArmed = true;
  }

  /** Freeze position and rotation. Stops the leveler from turning the board. */
  public lock() {
    this.locked = true;
    this.posed = true;
    this.snapArmed = false;
    this.held = false;
    this.targetY = null;
    print("BoardLeveler: pattern pinned");
  }

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => this.setup());
    this.createEvent("LateUpdateEvent").bind(() => this.tick());
  }

  private setup() {
    if (this.handle !== undefined && !isNull(this.handle)) {
      this.handle.onTriggerStart.add(() => {
        this.held = true;
        this.targetY = null;
      });
      this.handle.onTriggerEnd.add(() => {
        this.held = false;
      });
    }
    if (!this.snapToSurface) {
      return;
    }
    try {
      const mod = require("LensStudio:WorldQueryModule") as WorldQueryModule;
      if (mod !== null && mod.createHitTestSession !== undefined) {
        this.hitSession = mod.createHitTestSession();
        this.hitSession.start();
        print("BoardLeveler: World Query listo (snap a superficies)");
      }
    } catch (e) {
      print("BoardLeveler: sin World Query (editor); solo nivelado");
    }
  }

  private tick() {
    if (this.locked) {
      return;
    }
    const tr = this.getSceneObject().getTransform();

    // Before placement, keep the board flat. After placement, do not
    // rewrite rotation — that was turning the pattern on its own.
    if (!this.posed && !this.snapArmed) {
      const rot = tr.getWorldRotation();
      const right = rot.multiplyVec3(new vec3(1, 0, 0));
      const yaw = Math.atan2(-right.z, right.x);
      const flat = quat.angleAxis(-Math.PI / 2, new vec3(1, 0, 0));
      const target = quat.angleAxis(yaw, vec3.up()).multiply(flat);
      const s = Math.min(1, getDeltaTime() * this.levelSpeed);
      tr.setWorldRotation(quat.slerp(rot, target, s));
    }

    if (!this.snapArmed || this.hitSession === null) {
      return;
    }
    const pos = tr.getWorldPosition();
    if (!this.rayBusy) {
      this.rayBusy = true;
      const from = new vec3(pos.x, pos.y + 40, pos.z);
      const to = new vec3(pos.x, pos.y - 250, pos.z);
      try {
        this.hitSession.hitTest(from, to, (result: WorldQueryHitTestResult) => {
          this.rayBusy = false;
          if (result !== null && result !== undefined) {
            this.targetY = result.position.y + this.surfaceOffsetCm;
          }
        });
      } catch (e) {
        this.rayBusy = false;
        this.hitSession = null;
        print("BoardLeveler: hitTest no disponible: " + e);
      }
    }
    if (this.targetY !== null) {
      const k = Math.min(1, getDeltaTime() * 6);
      const ny = pos.y + (this.targetY - pos.y) * k;
      tr.setWorldPosition(new vec3(pos.x, ny, pos.z));
    }
  }
}
