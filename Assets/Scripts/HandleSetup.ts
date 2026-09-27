// Manija de agarre del tablero de moldes: genera su visual (quad doble cara)
// y un collider a medida para que SIK pueda apuntarle y manipular el tablero.
//
// 5.15 SIK 0.15.0: Interactable.getTypeName(), onHoverEnter, onTriggerStart,
// onTriggerEnd, and colliders match. Drag itself is InteractableManipulation
// on this object (attached when the scene is wired, not created here).

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";

@component
export class HandleSetup extends BaseScriptComponent {
  @input material: Material;
  @input width: number = 14; // cm
  @input height: number = 5; // cm

  onAwake() {
    const ink = new vec4(1, 1, 1, 1);
    const iconObj = global.scene.createSceneObject("slideIcon");
    iconObj.setParent(this.sceneObject);
    iconObj.getTransform().setLocalPosition(new vec3(0, 1.2, 8));
    iconObj.getTransform().setLocalScale(new vec3(2.4, 2.4, 2.4));
    const icon = iconObj.createComponent("Component.Text") as Text;
    icon.text = "+";
    icon.size = 72;
    icon.renderOrder = 130;
    icon.textFill.color = ink;

    const wordObj = global.scene.createSceneObject("slideWord");
    wordObj.setParent(this.sceneObject);
    wordObj.getTransform().setLocalPosition(new vec3(0, -2.2, 8));
    const word = wordObj.createComponent("Component.Text") as Text;
    word.text = "MOVE / TURN";
    word.size = 48;
    word.renderOrder = 130;
    word.textFill.color = ink;

    try {
      const collider = this.sceneObject.createComponent("Physics.ColliderComponent") as ColliderComponent;
      const shape = Shape.createBoxShape();
      shape.size = new vec3(14, 10, 8);
      collider.shape = shape;
      print("HandleSetup: collider listo " + this.width + "x" + this.height);
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
