// The arrow only marks the surface under the ray. A pinch in that direction
// places the pattern board on the detected surface, not on the arrow itself.

import { InteractionManager } from "SpectaclesInteractionKit.lspkg/Core/InteractionManager/InteractionManager";
import { Interactor, InteractorInputType } from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor";
import { makeLabel, makeTappable } from "./UiLite";
import { BoardLeveler } from "./BoardLeveler";

@component
export class SurfacePlacer extends BaseScriptComponent {
  private marker: SceneObject | null = null;
  private chevrons: Text[] = [];
  private board: SceneObject | null = null;
  private hitSession: HitTestSession | null = null;
  private rayBusy: boolean = false;
  private aiming: boolean = false;
  private placed: boolean = false;
  private placePending: boolean = false;
  private hitPoint: vec3 | null = null;
  private bob: number = 0;
  private camera: Transform | null = null;
  private listening: boolean = false;
  private pinObj: SceneObject | null = null;
  private pinned: boolean = false;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => this.ensureSession());
    this.createEvent("UpdateEvent").bind(() => this.tick());
  }

  begin(board: SceneObject) {
    this.board = board;
    this.placed = false;
    this.aiming = true;
    this.placePending = false;
    this.hitPoint = null;
    this.ensureSession();
    this.ensureMarker();
    this.listenForPinch();
    if (this.marker !== null) {
      this.marker.enabled = true;
    }
    const leveler = board.getComponent(BoardLeveler.getTypeName()) as BoardLeveler;
    if (leveler !== null && !isNull(leveler)) {
      leveler.setSnapArmed(false);
    }
    print("SurfacePlacer: pinch the surface where the arrow sits");
  }

  private ensureSession() {
    if (this.hitSession !== null) {
      return;
    }
    try {
      const mod = require("LensStudio:WorldQueryModule") as WorldQueryModule;
      this.hitSession = mod.createHitTestSession();
      this.hitSession.start();
    } catch (e) {
      print("SurfacePlacer: no World Query, using a point in front of the camera");
    }
  }

  private ensureMarker() {
    if (this.marker !== null && !isNull(this.marker)) {
      return;
    }
    const root = global.scene.createSceneObject("placeMarker");
    this.marker = root;
    this.chevrons = [];
    const ink = new vec4(1, 1, 1, 1);
    const faint = new vec4(1, 1, 1, 0.35);
    for (let i = 0; i < 3; i++) {
      const obj = global.scene.createSceneObject("chevron" + i);
      obj.setParent(root);
      obj.getTransform().setLocalPosition(new vec3(0, 16 - i * 4.2, 0));
      obj.getTransform().setLocalScale(new vec3(2.2, 2.2, 2.2));
      const mark = obj.createComponent("Component.Text") as Text;
      mark.text = "▼";
      mark.size = 72;
      mark.renderOrder = 140;
      mark.textFill.color = i === 0 ? ink : faint;
      this.chevrons.push(mark);
    }
    const label = makeLabel(root, "Tap to place on surface", 1.35, new vec3(0, 2.4, 0), ink);
    label.renderOrder = 140;
  }

  private listenForPinch() {
    if (this.listening) {
      return;
    }
    this.listening = true;
    const manager = InteractionManager.getInstance();
    const hands = manager.getInteractorsByType(InteractorInputType.All);
    for (let i = 0; i < hands.length; i++) {
      const interactor = hands[i];
      interactor.onTriggerEnd.add(() => this.onPinch(interactor));
    }
  }

  private onPinch(interactor: Interactor) {
    if (!this.aiming || this.placed) {
      return;
    }
    if (interactor.currentInteractable !== null && !isNull(interactor.currentInteractable)) {
      return;
    }
    if (this.hitPoint === null) {
      print("SurfacePlacer: no surface in view yet");
      return;
    }
    this.placeAt(this.hitPoint);
  }

  private tick() {
    if (!this.aiming || this.placed || this.marker === null) {
      return;
    }
    this.bob += getDeltaTime();
    const step = Math.floor(this.bob / 0.28) % 4;
    const ink = new vec4(1, 1, 1, 1);
    const faint = new vec4(1, 1, 1, 0.35);
    for (let i = 0; i < this.chevrons.length; i++) {
      this.chevrons[i].textFill.color = i < step ? ink : faint;
    }
    if (!this.placePending) {
      const ray = this.cameraRay();
      if (ray !== null) {
        this.cast(ray.from, ray.to, false);
      }
    }
    if (this.hitPoint !== null) {
      const p = this.hitPoint;
      this.marker.getTransform().setWorldPosition(new vec3(p.x, p.y + 1, p.z));
      this.faceCamera(p);
    }
  }

  private cameraRay(): { from: vec3; to: vec3 } | null {
    const cam = this.cameraTransform();
    if (cam === null) {
      return null;
    }
    const origin = cam.getWorldPosition();
    const forward = cam.getWorldRotation().multiplyVec3(new vec3(0, 0, -1));
    return {
      from: origin,
      to: new vec3(origin.x + forward.x * 500, origin.y + forward.y * 500, origin.z + forward.z * 500)
    };
  }

  private faceCamera(at: vec3) {
    const cam = this.cameraTransform();
    if (cam === null || this.marker === null) {
      return;
    }
    const eye = cam.getWorldPosition();
    const yaw = Math.atan2(eye.x - at.x, eye.z - at.z);
    this.marker.getTransform().setWorldRotation(quat.angleAxis(yaw, vec3.up()));
  }

  private cast(from: vec3, to: vec3, commit: boolean) {
    if (this.hitSession === null) {
      this.hitPoint = to;
      if (commit) {
        this.placeAt(to);
      }
      return;
    }
    if (this.rayBusy && !commit) {
      return;
    }
    this.rayBusy = true;
    try {
      this.hitSession.hitTest(from, to, (result: WorldQueryHitTestResult) => {
        this.rayBusy = false;
        if (result !== null && result !== undefined) {
          this.hitPoint = result.position;
          if (commit) {
            this.placeAt(result.position);
          }
        } else if (commit) {
          this.placePending = false;
          print("SurfacePlacer: no surface under that pinch");
        }
      });
    } catch (e) {
      this.rayBusy = false;
      this.placePending = false;
    }
  }

  private placeAt(p: vec3) {
    if (this.placed || this.board === null || isNull(this.board)) {
      return;
    }
    const tr = this.board.getTransform();
    tr.setWorldPosition(new vec3(p.x, p.y + 1, p.z));
    tr.setWorldRotation(quat.angleAxis(-Math.PI / 2, new vec3(1, 0, 0)));
    this.placed = true;
    this.aiming = false;
    this.placePending = false;
    if (this.marker !== null) {
      this.marker.enabled = false;
    }
    const leveler = this.board.getComponent(BoardLeveler.getTypeName()) as BoardLeveler;
    if (leveler !== null && !isNull(leveler)) {
      leveler.releaseToUser();
    }
    this.showPin();
    print("SurfacePlacer: pinch MOVE to slide on the surface, then PIN");
  }

  private showPin() {
    if (this.board === null || this.pinObj !== null) {
      return;
    }
    const pin = global.scene.createSceneObject("Pin");
    pin.setParent(this.board);
    pin.getTransform().setLocalPosition(new vec3(26, -14, 0.5));
    pin.getTransform().setLocalRotation(quat.quatIdentity());
    pin.getTransform().setLocalScale(new vec3(1, 1, 1));
    const label = makeLabel(pin, "PIN", 0.7, new vec3(0, 0, 0), new vec4(1, 1, 1, 1));
    label.renderOrder = 150;
    makeTappable(pin, 8, 3, () => this.pin());
    this.pinObj = pin;
  }

  private pin() {
    if (this.pinned || this.board === null || isNull(this.board)) {
      return;
    }
    this.pinned = true;
    const leveler = this.board.getComponent(BoardLeveler.getTypeName()) as BoardLeveler;
    if (leveler !== null && !isNull(leveler)) {
      leveler.lock();
    }
    const count = this.board.getChildrenCount();
    for (let i = 0; i < count; i++) {
      const child = this.board.getChild(i);
      if (child.name === "Handle") {
        child.enabled = false;
      }
    }
    if (this.pinObj !== null && !isNull(this.pinObj)) {
      this.pinObj.enabled = false;
    }
    print("SurfacePlacer: pattern pinned");
  }

  private cameraTransform(): Transform | null {
    if (this.camera !== null) {
      return this.camera;
    }
    const n = global.scene.getRootObjectsCount();
    for (let i = 0; i < n; i++) {
      const found = this.findCamera(global.scene.getRootObject(i));
      if (found !== null) {
        this.camera = found;
        return found;
      }
    }
    return null;
  }

  private findCamera(obj: SceneObject): Transform | null {
    const cam = obj.getComponent("Component.Camera") as Camera;
    if (cam !== null && !isNull(cam)) {
      return obj.getTransform();
    }
    const count = obj.getChildrenCount();
    for (let i = 0; i < count; i++) {
      const found = this.findCamera(obj.getChild(i));
      if (found !== null) {
        return found;
      }
    }
    return null;
  }
}
