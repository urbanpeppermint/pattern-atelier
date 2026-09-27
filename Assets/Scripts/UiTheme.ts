// Optional UI font. Assign a .ttf / .otf on the component; empty uses the system font.

import { setUiFont } from "./UiLite";
import { DestroyHelper } from "./DestroyHelper";

@component
export class UiTheme extends BaseScriptComponent {
  @input
  @allowUndefined
  font: Font;

  onAwake() {
    DestroyHelper.ensurePump(this);
    if (this.font !== undefined && !isNull(this.font)) {
      setUiFont(this.font);
    }
  }
}
