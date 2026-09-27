// Puts a MOVE / TURN handle and a FOLLOW button on the UI panel.
// Drag parks the panel where you leave it. FOLLOW makes it track the head again.

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { makeLabel, makeTappable } from "./UiLite";
import { LazyFollow } from "./LazyFollow";

@component
export class UiPanelRig extends BaseScriptComponent {
  private follow: LazyFollow | null = null;
  private wired: boolean = false;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => this.arm());
  }

  arm() {
    if (this.wired) {
      return;
    }
    this.wired = true;
    this.follow = this.getSceneObject().getComponent(LazyFollow.getTypeName()) as LazyFollow;
    if (this.follow === null || isNull(this.follow)) {
      this.follow = this.getSceneObject().createComponent(LazyFollow.getTypeName()) as LazyFollow;
    }
    this.follow.setFollow(true);
    this.wireHandle();
    this.addFollowButton();
    print("UiPanelRig: MOVE parks the panel, FOLLOW tracks the head");
  }

  private wireHandle() {
    const count = this.getSceneObject().getChildrenCount();
    for (let i = 0; i < count; i++) {
      const child = this.getSceneObject().getChild(i);
      if (child.name !== "UiHandle") {
        continue;
      }
      const interactable = child.getComponent(Interactable.getTypeName()) as Interactable;
      if (interactable === null || isNull(interactable)) {
        return;
      }
      interactable.onTriggerStart.add(() => {
        if (this.follow !== null && !isNull(this.follow)) {
          this.follow.setFollow(false);
        }
      });
      return;
    }
  }

  private addFollowButton() {
    const btn = global.scene.createSceneObject("FollowButton");
    btn.setParent(this.getSceneObject());
    btn.getTransform().setLocalPosition(new vec3(34, -24, 4));
    btn.getTransform().setLocalRotation(quat.quatIdentity());
    btn.getTransform().setLocalScale(new vec3(1, 1, 1));
    const label = makeLabel(btn, "FOLLOW", 1.4, new vec3(0, 0, 0.2), new vec4(1, 1, 1, 1));
    label.renderOrder = 140;
    makeTappable(btn, 12, 4, () => {
      if (this.follow !== null && !isNull(this.follow)) {
        this.follow.setFollow(true);
      }
    });
  }
}
