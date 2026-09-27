// Destrucción diferida de UI dinámica: evita que SIK referencie Interactables
// ya destruidos (CursorViewModel "Object is null").
//
// 5.15 SceneObject has no getComponentsInDescendants (that call is 5.23).
// Walk getChild / getComponents instead, including the root.

@component
export class DestroyHelper extends BaseScriptComponent {
  private static queue: SceneObject[] = [];
  private static pumping: boolean = false;

  onAwake() {
    DestroyHelper.ensurePump(this);
  }

  static ensurePump(host: BaseScriptComponent) {
    if (DestroyHelper.pumping) {
      return;
    }
    DestroyHelper.pumping = true;
    host.createEvent("LateUpdateEvent").bind(() => {
      if (DestroyHelper.queue.length === 0) {
        return;
      }
      const batch = DestroyHelper.queue;
      DestroyHelper.queue = [];
      for (let i = 0; i < batch.length; i++) {
        const obj = batch[i];
        if (obj !== null && !isNull(obj)) {
          obj.destroy();
        }
      }
    });
  }

  static schedule(root: SceneObject | null) {
    if (root === null || isNull(root)) {
      return;
    }
    DestroyHelper.disableTree(root);
    root.enabled = false;
    DestroyHelper.queue.push(root);
  }

  private static disableTree(root: SceneObject) {
    const stack: SceneObject[] = [root];
    while (stack.length > 0) {
      const current = stack.pop() as SceneObject;
      current.enabled = false;
      const scripts = current.getComponents("Component.ScriptComponent") as ScriptComponent[];
      for (let i = 0; i < scripts.length; i++) {
        scripts[i].enabled = false;
      }
      const colliders = current.getComponents("Physics.ColliderComponent") as ColliderComponent[];
      for (let i = 0; i < colliders.length; i++) {
        colliders[i].enabled = false;
      }
      const childCount = current.getChildrenCount();
      for (let c = 0; c < childCount; c++) {
        stack.push(current.getChild(c));
      }
    }
  }
}
