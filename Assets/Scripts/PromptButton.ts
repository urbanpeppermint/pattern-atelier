// Design-step prompt: ASR on Spectacles, keyboard in the editor.
// 5.15 still exposes require("LensStudio:AsrModule") and global.textInputSystem.
// ASR is loaded on first use so a missing module falls back to the keyboard.

import { makePlate, makeLabel, makeTappable, makeSticker, resetLocal } from "./UiLite";
import { buildQuadMesh } from "./LineMesh";
import { t } from "./I18n";

@component
export class PromptButton extends BaseScriptComponent {
  @input
  @allowUndefined
  buttonMaterial: Material;
  @input
  @allowUndefined
  listeningMaterial: Material;
  @input width: number = 26;
  @input height: number = 6;
  @input
  @allowUndefined
  stickerMaterial: Material;
  @input
  @allowUndefined
  barTexture: Texture;
  @input
  @allowUndefined
  boardTexture: Texture;
  @input barWidth: number = 42;
  @input boardWidth: number = 48;
  @input boardY: number = 33;

  public onPrompt: ((text: string) => void) | null = null;

  private asrModule: AsrModule | null = null;
  private listening: boolean = false;
  private statusText: Text | null = null;
  private buttonText: Text | null = null;
  private buttonVisual: RenderMeshVisual | null = null;
  private idleLabel: string = "● Hablá";
  private pendingStatus: string = "";
  private typing: boolean = false;
  private typedText: string = "";
  private typedSubmitted: boolean = false;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => this.setup());
  }

  private setup() {
    const skinned =
      this.barTexture !== undefined &&
      !isNull(this.barTexture) &&
      this.stickerMaterial !== undefined &&
      !isNull(this.stickerMaterial);
    if (skinned) {
      const bar = makeSticker(this.sceneObject, "promptBar", this.stickerMaterial, this.barTexture, this.barWidth);
      const barH = (this.barWidth * this.barTexture.getHeight()) / this.barTexture.getWidth();
      this.buttonText = makeLabel(bar, "", 0.85, new vec3(-this.barWidth * 0.06, 0, 0.3), new vec4(0.13, 0.17, 0.32, 1));
      this.statusText = this.buttonText;
      makeTappable(this.sceneObject, this.barWidth, barH + 1, () => this.onTap());
      const mic = global.scene.createSceneObject("micBtn");
      mic.setParent(this.sceneObject);
      resetLocal(mic);
      mic.getTransform().setLocalPosition(new vec3(this.barWidth * 0.235, 0, 0.8));
      makeTappable(mic, barH * 0.95, barH * 0.95, () => this.onMicTap());
      if (this.boardTexture !== undefined && !isNull(this.boardTexture)) {
        const board = makeSticker(this.sceneObject, "styleBoard", this.stickerMaterial, this.boardTexture, this.boardWidth);
        board.getTransform().setLocalPosition(new vec3(0, this.boardY, -1));
      }
    } else if (this.buttonMaterial !== undefined && !isNull(this.buttonMaterial)) {
      const mesh = buildQuadMesh(this.width, this.height);
      if (mesh !== null) {
        this.buttonVisual = this.sceneObject.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
        this.buttonVisual.mesh = mesh;
        this.buttonVisual.mainMaterial = this.buttonMaterial;
      }
      this.buttonText = makeLabel(this.sceneObject, this.idleLabel, 1.8, new vec3(0, 0, 0.2));
      this.statusText = makeLabel(this.sceneObject, this.pendingStatus, 1.4, new vec3(0, this.height / 2 + 2.4, 0.2));
      makeTappable(this.sceneObject, this.width, this.height, () => this.onTap());
    } else {
      print("PromptButton: no bar texture or buttonMaterial");
    }
  }

  configure(idleLabel: string, statusHint: string) {
    this.idleLabel = idleLabel;
    if (this.buttonText !== null) {
      this.buttonText.text = idleLabel;
    }
    this.setStatus(statusHint);
  }

  setStatus(message: string) {
    const short = message.length > 64 ? message.substring(0, 63) + "…" : message;
    this.pendingStatus = short;
    if (this.statusText !== null) {
      this.statusText.text = short;
    }
  }

  private emit(text: string) {
    if (this.onPrompt !== null && text !== "") {
      this.onPrompt(text);
    }
  }

  private asr(): AsrModule | null {
    if (this.asrModule !== null) {
      return this.asrModule;
    }
    try {
      this.asrModule = require("LensStudio:AsrModule") as AsrModule;
      return this.asrModule;
    } catch (e) {
      print("PromptButton: AsrModule missing (" + e + ")");
      return null;
    }
  }

  private onMicTap() {
    if (this.listening) {
      this.stopListening();
      return;
    }
    if (!this.startListening()) {
      this.micFallback();
    }
  }

  private micFallback() {
    this.listening = false;
    this.setButtonLook(false, this.idleLabel);
    this.setStatus(t("micHint"));
    if (!this.typing) {
      this.openKeyboard();
    }
  }

  private onTap() {
    if (global.deviceInfoSystem.isEditor()) {
      if (!this.typing) {
        this.openKeyboard();
      }
      return;
    }
    if (this.listening) {
      this.stopListening();
    } else if (!this.startListening()) {
      this.micFallback();
    }
  }

  private openKeyboard() {
    this.typing = true;
    this.typedText = "";
    this.typedSubmitted = false;
    this.setButtonLook(true, "⌨ …");
    this.setStatus(t("typeHint"));

    const options = new TextInputSystem.KeyboardOptions();
    options.enablePreview = true;
    options.keyboardType = TextInputSystem.KeyboardType.Text;
    options.returnKeyType = TextInputSystem.ReturnKeyType.Done;
    options.onTextChanged = (text: string) => {
      this.typedText = text;
      this.setStatus(text === "" ? t("typeHint") : text);
    };
    options.onReturnKeyPressed = () => {
      this.typedSubmitted = true;
      global.textInputSystem.dismissKeyboard();
    };
    options.onKeyboardStateChanged = (keyboardIsOpen: boolean) => {
      if (!keyboardIsOpen && this.typing) {
        this.typing = false;
        this.setButtonLook(false, this.idleLabel);
        const text = this.typedText.trim();
        this.typedText = "";
        if (this.typedSubmitted && text !== "") {
          this.emit(text);
        } else {
          this.setStatus(t("typeHint"));
        }
      }
    };
    global.textInputSystem.requestKeyboard(options);
  }

  private startListening(): boolean {
    const asr = this.asr();
    if (asr === null) {
      return false;
    }
    this.listening = true;
    this.setButtonLook(true, t("listening"));
    try {
      const options = AsrModule.AsrTranscriptionOptions.create();
      options.silenceUntilTerminationMs = 1200;
      options.mode = AsrModule.AsrMode.HighAccuracy;
      options.onTranscriptionUpdateEvent.add((args) => {
        this.setStatus(args.text);
        if (args.isFinal) {
          this.stopListening();
          this.emit(args.text);
        }
      });
      options.onTranscriptionErrorEvent.add((code) => {
        this.stopListening();
        this.setStatus(t("voiceError") + " (" + code + ")");
        if (global.deviceInfoSystem.isEditor()) {
          this.micFallback();
        }
      });
      asr.startTranscribing(options);
      return true;
    } catch (e) {
      print("PromptButton: ASR start failed (" + e + ")");
      this.listening = false;
      return false;
    }
  }

  private stopListening() {
    this.listening = false;
    this.setButtonLook(false, this.idleLabel);
    if (this.asrModule !== null) {
      const stop = this.asrModule.stopTranscribing();
      if (stop !== undefined && stop !== null && stop.catch !== undefined) {
        stop.catch((e) => print("PromptButton: stopTranscribing " + e));
      }
    }
  }

  private setButtonLook(listening: boolean, label: string) {
    if (this.buttonText !== null) {
      this.buttonText.text = label;
    }
    if (this.buttonVisual !== null && this.buttonMaterial !== undefined && !isNull(this.buttonMaterial)) {
      const mat =
        listening && this.listeningMaterial !== undefined && !isNull(this.listeningMaterial)
          ? this.listeningMaterial
          : this.buttonMaterial;
      this.buttonVisual.mainMaterial = mat;
    }
  }
}
