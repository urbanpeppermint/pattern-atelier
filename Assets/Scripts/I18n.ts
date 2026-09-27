// Demo i18n: English and Spanish only. Default is English (landing copy).
// Later script ports call t(), tf(), garmentName(), stepNames(), LANGS, setLang, getLang, getLangDef.

export interface LangDef {
  code: string;
  native: string;
  aiName: string;
}

export const LANGS: LangDef[] = [
  { code: "en", native: "English", aiName: "English" },
  { code: "es", native: "Español", aiName: "Spanish (Rioplatense)" }
];

export const GARMENT_KEYS = ["pollera", "corpino", "camisa", "pantalon", "vestido", "mono", "mallas", "ropa_interior"];

const GARMENTS: { [lang: string]: string[] } = {
  es: ["Pollera", "Corpiño", "Camisa", "Pantalón", "Vestido", "Mono", "Mallas", "Ropa interior"],
  en: ["Skirt", "Bodice", "Shirt", "Pants", "Dress", "Jumpsuit", "Leggings", "Underwear"]
};

const STRINGS: { [lang: string]: { [key: string]: string } } = {
  es: {
    menuTitle: "¿Qué querés crear hoy?",
    tellStyle: "● Contame el estilo",
    sayChange: "● Decí el cambio",
    typeHint: "Escribí tu pedido y apretá Enter",
    modify: "Modificar",
    toFabric: "A la tela ▸",
    backMenu: "‹ Menú",
    newGarment: "+ Nueva prenda",
    pieceFront: "DELANTERO",
    pieceBack: "TRASERO",
    pieceSleeve: "MANGA",
    pieceLeg: "PIERNA",
    pieceCollar: "CUELLO",
    pieceCollarStand: "PIE DE CUELLO",
    pieceCuff: "PUÑO",
    pieceGusset: "ENTREPIERNA",
    demoBodice: "Corpiño 1950",
    demoSkirt: "Pollera plato",
    aiReady: "¡Listo! {0} moldes ✓",
    aiAdjusting: "Ajustando el molde…",
    aiUpdated: "Molde actualizado",
    aiNone: "Ninguna AI respondió (¿token RSG?)",
    voiceError: "Error de voz",
    micHint: "Mic acá: iniciá sesión en My Lenses (en Specs anda directo) ⌨",
    listening: "● Escuchando…",
    working: "Creando tus moldes…",
    mIntroMenu: "Elegí la prenda que querés crear.",
    mStyle: "Tocá CONFIRMAR para seguir con este diseño.",
    mCards: "Tocá \"Modificar\" para ajustar un molde, o \"Ver terminada\" para ver cómo quedaría cosida.",
    mModify: "Decime qué cambiamos de este molde.",
    mError: "Uy, algo falló. Probá de nuevo en un ratito.",
    mGender: "¿Para quién es la prenda?",
    genderF: "Mujer",
    genderM: "Hombre",
    continueBtn: "CONTINUAR",
    chooseLang: "Elegí tu idioma",
    atelierSpeak: "Tu taller va a hablar con vos",
    mIntroLang: "Soy tu asistente del atelier. Elegí tu idioma.",
    mIntroLanding: "Soy tu asistente del atelier. Tocá ENTER ATELIER para empezar.",
    mLangChanged: "Idioma actualizado.",
    sizeTitle: "Elegí tu talle",
    mSize: "Para saber tu talle, medí tu cintura con un centímetro. Cada talle muestra busto·cintura·cadera en cm. Si dudás entre dos, elegí el más grande.",
    cutLine: "✂ CORTAR por la línea amarilla",
    sewLine: "— línea de costura (margen {0} cm)",
    onFold: "AL DOBLEZ",
    doubleFabric: "×2 · DOBLE TELA",
    previewFit: "Ver terminada ▸",
    fitTitle: "Prenda terminada",
    fitWorking: "Imaginando cómo va a quedar…",
    fitDefault: "Quedaría elegante y cómoda en tu talle.",
    fitError: "No pude generar la vista previa. Probá de nuevo.",
    fitNoImage: "(No pudimos generar la ilustración — probá de nuevo)",
    backPatterns: "‹ Moldes",
    mFitIntro: "Imaginando cómo quedaría cosida…"
  },
  en: {
    menuTitle: "What do you want to create?",
    tellStyle: "● Describe the style",
    sayChange: "● Say the change",
    typeHint: "Type your request and press Enter",
    modify: "Modify",
    toFabric: "To fabric ▸",
    backMenu: "‹ Menu",
    newGarment: "+ New garment",
    pieceFront: "FRONT",
    pieceBack: "BACK",
    pieceSleeve: "SLEEVE",
    pieceLeg: "LEG",
    pieceCollar: "COLLAR",
    pieceCollarStand: "COLLAR STAND",
    pieceCuff: "CUFF",
    pieceGusset: "GUSSET",
    demoBodice: "1950s Bodice",
    demoSkirt: "Circle skirt",
    aiReady: "Done! {0} patterns ✓",
    aiAdjusting: "Adjusting the pattern…",
    aiUpdated: "Pattern updated",
    aiNone: "No AI responded (RSG token?)",
    voiceError: "Voice error",
    micHint: "Mic here: sign in to My Lenses (works directly on Specs) ⌨",
    listening: "● Listening…",
    working: "Drafting your patterns…",
    mIntroMenu: "Choose the piece you want to create.",
    mStyle: "Pinch CONFIRM to continue with this design.",
    mCards: "Tap \"Modify\" to adjust a pattern, or \"Preview fit\" to see the finished garment.",
    mModify: "Tell me what to change on this pattern.",
    mError: "Oops, something failed. Try again in a moment.",
    mGender: "Who is the garment for?",
    genderF: "Woman",
    genderM: "Man",
    continueBtn: "CONTINUE",
    chooseLang: "Choose your language",
    atelierSpeak: "Your atelier will speak with you",
    mIntroLang: "I am your Atelier Assistant. Choose your language.",
    mIntroLanding: "I am your Atelier Assistant. Tap ENTER ATELIER to begin.",
    mLangChanged: "Language updated.",
    sizeTitle: "Pick your size",
    mSize: "To find your size, measure your waist with a tape. Each size shows bust·waist·hip in cm. If in doubt, pick the larger one.",
    cutLine: "✂ CUT along the yellow line",
    sewLine: "— sewing line ({0} cm allowance)",
    onFold: "ON FOLD",
    doubleFabric: "×2 · DOUBLE LAYER",
    previewFit: "Preview fit ▸",
    fitTitle: "Finished garment",
    fitWorking: "Imagining how it will fit…",
    fitDefault: "It would look elegant and comfortable in your size.",
    fitError: "Couldn't generate the preview. Try again in a moment.",
    fitNoImage: "(Couldn't generate the illustration — try again)",
    backPatterns: "‹ Patterns",
    mFitIntro: "Imagining the finished look…"
  }
};

const STEPS: { [lang: string]: string[] } = {
  es: ["INICIO", "PRENDA", "CUERPO", "MEDIDAS", "DISEÑO", "IA", "VISTA", "TELA"],
  en: ["ENTER", "GARMENT", "BODY", "MEASURE", "DESIGN", "AI", "PREVIEW", "FABRIC"]
};

export function stepNames(): string[] {
  return STEPS[currentLang] !== undefined ? STEPS[currentLang] : STEPS["en"];
}

let currentLang: string = "en";

export function setLang(code: string) {
  if (STRINGS[code] !== undefined) {
    currentLang = code;
  }
}

export function getLang(): string {
  return currentLang;
}

export function getLangDef(): LangDef {
  for (let i = 0; i < LANGS.length; i++) {
    if (LANGS[i].code === currentLang) {
      return LANGS[i];
    }
  }
  return LANGS[0];
}

export function t(key: string): string {
  const table = STRINGS[currentLang];
  if (table !== undefined && table[key] !== undefined) {
    return table[key];
  }
  const en = STRINGS["en"];
  if (en !== undefined && en[key] !== undefined) {
    return en[key];
  }
  return key;
}

export function tf(key: string, arg: string): string {
  return t(key).replace("{0}", arg);
}

export function garmentName(index: number): string {
  const names = GARMENTS[currentLang] !== undefined ? GARMENTS[currentLang] : GARMENTS["en"];
  return names[index];
}
