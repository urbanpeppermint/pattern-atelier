// Invisible grab on the pattern itself. No floating label.
// Drag and rotate come from InteractableManipulation on this object.

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";

@component
export class HandleSetup extends BaseScriptComponent {
  @input material: Material;
  @input width: number = 10; // cm
  @input height: number = 4; // cm

  onAwake() {
    const wordObj = global.scene.createSceneObject("moveWord");
    wordObj.setParent(this.sceneObject);
    wordObj.getTransform().setLocalPosition(new vec3(0, 0, 0.4));
    const word = wordObj.createComponent("Component.Text") as Text;
    word.text = "MOVE";
    word.size = 48;
    word.renderOrder = 150;
    word.textFill.color = new vec4(1, 1, 1, 1);

    try {
      const collider = this.sceneObject.createComponent("Physics.ColliderComponent") as ColliderComponent;
      const shape = Shape.createBoxShape();
      shape.size = new vec3(this.width, this.height, 4);
      collider.shape = shape;
      print("HandleSetup: grab " + this.width + "x" + this.height);
    } catch (e) {
      print("HandleSetup: fallo el collider: " + e);
    }

    this.createEvent("OnStartEvent").bind(() => this.hookEvents());
  }

  private hookEvents() {
    const interactable = this.sceneObject.getComponent(
      Interactable.getTypeName()
    ) as Interactable;
    if (isNull(interactable)) {
      print("HandleSetup: no encontré Interactable en el objeto");
      return;
    }
    interactable.onHoverEnter.add(() => print("HandleSetup: hover enter"));
    interactable.onTriggerStart.add(() => print("HandleSetup: trigger start"));
    interactable.onTriggerEnd.add(() => print("HandleSetup: trigger end"));
    print("HandleSetup: eventos conectados, colliders=" + interactable.colliders.length);
  }
}
