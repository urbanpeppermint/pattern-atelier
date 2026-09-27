// Persistencia liviana del proyecto (prenda + estilo + cards).
// StoredCard matches the later PatternAI.AICard fields. PatternAI is not
// ported in step A, so this file does not import it.

const PROJECT_KEY = "pattern_project_v3";

export interface StoredCard {
  block: string;
  name: string;
  section: string;
  params: { [key: string]: number };
}

export interface ProjectData {
  garment: string;
  garmentLabel: string;
  stylePrompt: string;
  cards: StoredCard[];
}

export function saveProject(project: ProjectData) {
  const store = global.persistentStorageSystem.store;
  store.putString(PROJECT_KEY, JSON.stringify(project));
  print("PatternStore: proyecto guardado (" + project.cards.length + " cards)");
}

export function loadProject(): ProjectData | null {
  const store = global.persistentStorageSystem.store;
  const raw = store.getString(PROJECT_KEY);
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ProjectData;
    if (parsed.cards === undefined || parsed.cards.length === 0) {
      return null;
    }
    return parsed;
  } catch (e) {
    print("PatternStore: proyecto corrupto, se descarta");
    return null;
  }
}

export function clearProject() {
  const store = global.persistentStorageSystem.store;
  store.putString(PROJECT_KEY, "");
}
