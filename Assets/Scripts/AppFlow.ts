// Slim atelier flow for the 5.15 demo.
// LANDING → GARMENT → BODY → MEASURE → DESIGN → GENERATE → PREVIEW → FABRIC
// No carousels, no PatternAI. demoSeed supplies the dress (bodice + circle skirt).
// A typed or spoken style is kept as text, then the seeded pieces are shown.

import { PromptButton } from "./PromptButton";
import { Mascot } from "./Mascot";
import { PatternRenderer } from "./PatternRenderer";
import { buildSpecFromCard } from "./BlockRegistry";
import { saveProject, ProjectData, StoredCard } from "./PatternStore";
import { setLang, t, garmentName } from "./I18n";
import { AtelierFace, HOTSPOTS, AtelierScreenId, Hotspot } from "./AtelierFace";
import { LangDropdown } from "./LangDropdown";
import { SurfacePlacer } from "./SurfacePlacer";

const SIZE_LABELS = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
const SIZES_F = [
  { bust: 78, waist: 60, hip: 86 },
  { bust: 83, waist: 64, hip: 91 },
  { bust: 88, waist: 69, hip: 96 },
  { bust: 93, waist: 75, hip: 101 },
  { bust: 98, waist: 82, hip: 106 },
  { bust: 105, waist: 91, hip: 113 },
  { bust: 112, waist: 100, hip: 120 },
  { bust: 119, waist: 107, hip: 127 },
  { bust: 126, waist: 114, hip: 134 }
];
const SIZES_M = [
  { bust: 78, waist: 66, hip: 82 },
  { bust: 84, waist: 72, hip: 88 },
  { bust: 91, waist: 77, hip: 93 },
  { bust: 100, waist: 86, hip: 101 },
  { bust: 106, waist: 93, hip: 107 },
  { bust: 113, waist: 101, hip: 114 },
  { bust: 121, waist: 109, hip: 121 },
  { bust: 130, waist: 118, hip: 129 },
  { bust: 141, waist: 132, hip: 140 }
];

const ATELIER_GARMENTS: { key: string; garmentIndex: number }[] = [
  { key: "camisa", garmentIndex: 2 },
  { key: "vestido", garmentIndex: 4 },
  { key: "pantalon", garmentIndex: 3 },
  { key: "pollera", garmentIndex: 0 },
  { key: "camisa", garmentIndex: 2 }
];

@component
export class AppFlow extends BaseScriptComponent {
  @input
  @allowUndefined
  atelierFace: AtelierFace;
  @input
  @allowUndefined
  langDropdown: LangDropdown;
  @input
  @allowUndefined
  mascot: Mascot;
  @input
  @allowUndefined
  renderer: PatternRenderer;
  @input
  @allowUndefined
  promptBtn: PromptButton;
  @input demoSeed: boolean = true;

  private garment: string = "";
  private garmentLabel: string = "";
  private sizeLabel: string = "M";
  private measurements: string = "";
  private genderIdx: number = 0;
  private sizeIdx: number = 3;
  private garmentPick: number = 1;
  private lastCutIndex: number = 0;
  private stylePrompt: string = "";
  private projectCards: StoredCard[] = [];
  private state: string = "LANDING";
  private promptOpen: boolean = false;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => this.start());
  }

  private ok(obj: BaseScriptComponent | undefined): boolean {
    return obj !== undefined && !isNull(obj);
  }

  private start() {
    const faceOk = this.ok(this.atelierFace);
    const langOk = this.ok(this.langDropdown);
    const assistantOk = this.ok(this.mascot);
    const rendererOk = this.ok(this.renderer);
    print(
      "[Demo] atelierFace=" +
        (faceOk ? "OK" : "MISSING") +
        " lang=" +
        (langOk ? "OK" : "MISSING") +
        " assistant=" +
        (assistantOk ? "OK" : "MISSING") +
        " renderer=" +
        (rendererOk ? "OK" : "MISSING") +
        " demoSeed=" +
        this.demoSeed
    );
    if (!faceOk || !assistantOk || !rendererOk) {
      print("[Demo] AppFlow waiting for scene wiring");
      return;
    }

    setLang("en");
    if (this.ok(this.promptBtn)) {
      this.promptBtn.onPrompt = (text) => this.onPrompt(text);
      this.promptBtn.getSceneObject().enabled = false;
    }
    this.atelierFace.onHotspot = (id) => this.onAtelierHotspot(id);
    if (langOk) {
      this.langDropdown.onChanged = () => {
        this.langDropdown.refresh();
        this.mascot.say(t("mLangChanged"));
        this.refreshCurrentScreen();
      };
      this.langDropdown.setVisible(true);
    }

    if (this.demoSeed) {
      this.garment = "vestido";
      this.garmentLabel = garmentName(4);
      this.genderIdx = 0;
      this.sizeIdx = 3;
      this.measurements = "mujer, talle M: busto 93, cintura 75, cadera 101";
      this.seedCards();
    }

    const delay = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
    delay.bind(() => this.enterLanding());
    delay.reset(0.05);
  }

  private seedCards() {
    this.projectCards = [
      { block: "bodice", name: t("demoBodice"), section: "tops", params: { bust: 93, waist: 75, length: 40 } },
      { block: "circle_skirt", name: t("demoSkirt"), section: "faldas", params: { waist: 75, length: 65, fullness: 1 } }
    ];
    if (this.genderIdx === 0 || this.genderIdx === 1) {
      const table = this.genderIdx === 0 ? SIZES_F : SIZES_M;
      const sz = table[this.sizeIdx];
      this.projectCards[0].params = { bust: sz.bust, waist: sz.waist, length: 40 };
      this.projectCards[1].params = { waist: sz.waist, length: 65, fullness: 1 };
    }
  }

  private refreshCurrentScreen() {
    if (this.state === "LANDING") this.enterLanding();
    else if (this.state === "GARMENT") this.enterGarment();
    else if (this.state === "BODY") this.enterBody();
    else if (this.state === "MEASURE") this.enterMeasure();
    else if (this.state === "DESIGN") this.enterDesign();
    else if (this.state === "GENERATE") this.showAtelier("generate", HOTSPOTS.generate);
    else if (this.state === "PREVIEW") this.showAtelier("preview", HOTSPOTS.preview);
    else if (this.state === "FABRIC") this.showAtelier("fabric", HOTSPOTS.fabric);
  }

  private showAtelier(id: AtelierScreenId, spots: Hotspot[]) {
    if (this.ok(this.atelierFace)) {
      this.atelierFace.show(id, spots);
    }
    if (this.ok(this.langDropdown)) {
      this.langDropdown.setVisible(true);
      this.langDropdown.refresh();
    }
  }

  private onAtelierHotspot(id: string) {
    if (this.state === "LANDING") {
      if (id === "enter") this.enterGarment();
      return;
    }
    if (this.state === "GARMENT") {
      if (id === "back" || id === "prev") {
        this.enterLanding();
        return;
      }
      if (id === "next") {
        this.garmentPick = (this.garmentPick + 1) % 5;
        return;
      }
      if (id.indexOf("card") === 0) {
        const n = parseInt(id.substring(4), 10);
        if (!isNaN(n) && n >= 0 && n < 5) {
          this.garmentPick = n;
          this.commitGarment();
        }
      }
      return;
    }
    if (this.state === "BODY") {
      if (id === "back") {
        this.enterGarment();
        return;
      }
      if (id === "woman") {
        this.genderIdx = 0;
        this.sizeIdx = 3;
        this.enterMeasure();
      } else if (id === "man") {
        this.genderIdx = 1;
        this.sizeIdx = 3;
        this.enterMeasure();
      } else if (id === "confirm") {
        this.enterMeasure();
      }
      return;
    }
    if (this.state === "MEASURE") {
      if (id === "back") {
        this.enterBody();
        return;
      }
      if (id === "scan" || id === "manual" || id === "standard" || id === "confirm") {
        this.commitMeasurements();
        this.enterDesign();
      }
      return;
    }
    if (this.state === "DESIGN") {
      if (id === "back") {
        this.enterMeasure();
        return;
      }
      if (id === "confirm") {
        this.hidePrompt();
        this.skipToSeededPreview();
        return;
      }
      const note = this.designNote(id);
      if (note !== "") {
        this.hidePrompt();
        this.stylePrompt = note;
        this.mascot.say(note);
      }
      return;
    }
    if (this.state === "PREVIEW") {
      if (id === "back") {
        this.enterDesign();
        return;
      }
      if (id === "approve") {
        this.sendToFabric(this.lastCutIndex >= 0 ? this.lastCutIndex : 0);
        return;
      }
      if (id === "regenerate") {
        this.enterDesign();
      }
      return;
    }
    if (this.state === "FABRIC") {
      if (id === "back") {
        this.enterPreview(this.lastCutIndex);
      } else if (id === "nextPiece" && this.projectCards.length > 1) {
        const next = (this.lastCutIndex + 1) % this.projectCards.length;
        this.sendToFabric(next);
      }
    }
  }

  private designNote(id: string): string {
    if (id === "sil_fitted") return "Silhouette: fitted.";
    if (id === "sil_regular") return "Silhouette: regular.";
    if (id === "sil_oversized") return "Silhouette: oversized.";
    if (id === "len_mini") return "Length: mini.";
    if (id === "len_midi") return "Length: midi.";
    if (id === "len_maxi") return "Length: maxi.";
    if (id === "fabric") return "Fabric: silk satin.";
    if (id === "det_draped") return "Detail: draped.";
    if (id === "det_asymmetric") return "Detail: asymmetric.";
    if (id === "det_open") return "Detail: open back.";
    if (id === "det_slit") return "Detail: slit.";
    if (id === "det_add") return "Add another detail, then pinch CONFIRM.";
    if (id === "type") return "The description stays on the panel. Pinch CONFIRM to continue.";
    if (id === "voice") return "Voice stays on the panel. Pinch CONFIRM to continue.";
    return "";
  }

  private commitGarment() {
    const g = ATELIER_GARMENTS[this.garmentPick];
    this.garment = g.key;
    this.garmentLabel = garmentName(g.garmentIndex);
    if (!this.demoSeed) {
      this.projectCards = [];
    }
    this.enterBody();
  }

  private commitMeasurements() {
    const table = this.genderIdx === 0 ? SIZES_F : SIZES_M;
    const sz = table[this.sizeIdx];
    this.sizeLabel = SIZE_LABELS[this.sizeIdx];
    const genderWord = this.genderIdx === 0 ? "mujer" : "hombre";
    const bustWord = this.genderIdx === 0 ? "busto" : "pecho";
    this.measurements =
      genderWord + ", talle " + this.sizeLabel + ": " + bustWord + " " + sz.bust + ", cintura " + sz.waist + ", cadera " + sz.hip;
    if (this.demoSeed) {
      this.seedCards();
    }
  }

  private enterLanding() {
    this.state = "LANDING";
    this.promptOpen = false;
    this.hidePrompt();
    this.showAtelier("landing", HOTSPOTS.landing);
    let intro = t("mIntroLanding");
    if (intro === "mIntroLanding") {
      intro = "I am your Atelier Assistant. Tap ENTER ATELIER to begin.";
    }
    this.mascot.speak(intro);
  }

  private enterGarment() {
    this.state = "GARMENT";
    this.hidePrompt();
    this.showAtelier("garment", HOTSPOTS.garment);
    this.mascot.speak(t("mIntroMenu"));
  }

  private enterBody() {
    this.state = "BODY";
    this.hidePrompt();
    this.showAtelier("body", HOTSPOTS.body);
    this.mascot.speak(t("mGender"));
  }

  private enterMeasure() {
    this.state = "MEASURE";
    this.hidePrompt();
    this.showAtelier("measure", HOTSPOTS.measure);
    this.mascot.speak(t("mSize"));
  }

  private enterDesign() {
    this.state = "DESIGN";
    this.promptOpen = false;
    this.hidePrompt();
    this.showAtelier("design", HOTSPOTS.design);
    this.mascot.speak(t("mStyle"));
  }

  private enterGenerate() {
    this.state = "GENERATE";
    this.hidePrompt();
    this.showAtelier("generate", HOTSPOTS.generate);
    this.mascot.setThinking(true);
    this.mascot.say(t("working"));
  }

  private enterPreview(index: number) {
    this.lastCutIndex = index;
    this.state = "PREVIEW";
    this.hidePrompt();
    this.showAtelier("preview", HOTSPOTS.preview);
    this.mascot.setThinking(false);
    this.mascot.setMood("happy");
    this.mascot.say(t("mCards"));
  }

  private skipToSeededPreview() {
    if (this.projectCards.length < 2) {
      this.seedCards();
    }
    this.enterGenerate();
    const delay = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
    delay.bind(() => this.enterPreview(0));
    delay.reset(0.6);
  }

  private armPlacement() {
    const host = this.renderer.getSceneObject();
    let placer = host.getComponent(SurfacePlacer.getTypeName()) as SurfacePlacer;
    if (placer === null || isNull(placer)) {
      placer = host.createComponent(SurfacePlacer.getTypeName()) as SurfacePlacer;
    }
    placer.begin(host);
  }

  private hidePrompt() {
    if (this.ok(this.promptBtn)) {
      this.promptBtn.getSceneObject().enabled = false;
    }
  }

  private sendToFabric(index: number) {
    this.lastCutIndex = index;
    this.state = "FABRIC";
    const card = this.projectCards[index];
    if (card === undefined) {
      print("AppFlow: no pattern card at " + index);
      return;
    }
    const spec = buildSpecFromCard(card);
    if (spec === null) {
      print("AppFlow: unknown block " + card.block);
      return;
    }
    if (this.ok(this.renderer)) {
      this.renderer.renderPattern(spec);
      this.armPlacement();
    }
    this.showAtelier("fabric", HOTSPOTS.fabric);
    this.mascot.setMood("wink");
    this.mascot.setThinking(false);
    this.mascot.speak("Pinch the surface where you want the pattern.");
    this.persist();
  }

  private onPrompt(text: string) {
    this.stylePrompt = text;
    this.mascot.setMood("");
    if (this.demoSeed || this.projectCards.length >= 2) {
      this.skipToSeededPreview();
      return;
    }
    this.mascot.showError(t("aiNone"));
  }

  private persist() {
    const data: ProjectData = {
      garment: this.garment,
      garmentLabel: this.garmentLabel,
      stylePrompt: this.stylePrompt,
      cards: this.projectCards
    };
    saveProject(data);
  }
}
