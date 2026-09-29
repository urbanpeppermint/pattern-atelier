// Keeps the atelier panel where it sits in the scene.
// Head-follow and the floating MOVE handle are off: both slid the
// panel while a confirm pinch was in progress and rebuilt Preview.

import { LazyFollow } from "./LazyFollow";

@component
export class UiPanelRig extends BaseScriptComponent {
  private wired: boolean = false;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => this.arm());
  }

  arm() {
    if (this.wired) {
      return;
    }
    this.wired = true;
    const follow = this.getSceneObject().getComponent(LazyFollow.getTypeName()) as LazyFollow;
    if (follow !== null && !isNull(follow)) {
      follow.setFollow(false);
    }
    const count = this.getSceneObject().getChildrenCount();
    for (let i = 0; i < count; i++) {
      const child = this.getSceneObject().getChild(i);
      if (child.name === "UiHandle" || child.name === "FollowButton") {
        child.enabled = false;
      }
    }
  }
}
