import type {
  FontName,
  PatternConfig,
  PluginToUiMessage,
  ScatterConfig,
  WeaveConfig,
} from "./types";
import { PRESETS } from "./types";

type TabMode = "scatter" | "weave";

let fonts: FontName[] = [];
let activeTab: TabMode = "scatter";

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const val = (id: string) => (document.getElementById(id) as HTMLInputElement).value;
const num = (id: string) => Number(val(id));
const checked = (id: string) =>
  (document.getElementById(id) as HTMLInputElement).checked;

function setStatus(text: string, kind: "" | "error" | "warning" | "success" = "") {
  const el = $("status");
  el.textContent = text;
  el.className = kind;
}

function uniqueFamilies(list: FontName[]): string[] {
  return [...new Set(list.map((f) => f.family))].sort();
}

function stylesForFamily(family: string): string[] {
  return fonts
    .filter((f) => f.family === family)
    .map((f) => f.style)
    .sort();
}

function populateFontSelect(
  familyId: string,
  styleId: string,
  preferredFamily?: string
): void {
  const familyEl = document.getElementById(familyId) as HTMLSelectElement;
  const styleEl = document.getElementById(styleId) as HTMLSelectElement;
  const families = uniqueFamilies(fonts);
  familyEl.innerHTML = families
    .map((f) => `<option value="${f}">${f}</option>`)
    .join("");

  const defaultFamily =
    preferredFamily && families.includes(preferredFamily)
      ? preferredFamily
      : families[0] ?? "";
  familyEl.value = defaultFamily;

  const updateStyles = () => {
    const styles = stylesForFamily(familyEl.value);
    styleEl.innerHTML = styles
      .map((s) => `<option value="${s}">${s}</option>`)
      .join("");
    const regular = styles.find((s) => s.toLowerCase() === "regular");
    styleEl.value = regular ?? styles[0] ?? "";
  };

  familyEl.onchange = updateStyles;
  updateStyles();
}

function getFont(familyId: string, styleId: string): FontName {
  return {
    family: (document.getElementById(familyId) as HTMLSelectElement).value,
    style: (document.getElementById(styleId) as HTMLSelectElement).value,
  };
}

function applyPreset(key: string): void {
  if (!key || !(key in PRESETS)) return;
  const preset = PRESETS[key as keyof typeof PRESETS];

  $("name").setAttribute("value", preset.name);
  (document.getElementById("name") as HTMLInputElement).value = preset.name;
  (document.getElementById("width") as HTMLInputElement).value = String(preset.width);
  (document.getElementById("height") as HTMLInputElement).value = String(preset.height);
  (document.getElementById("bgColor") as HTMLInputElement).value = preset.backgroundColor;
  (document.getElementById("textColor") as HTMLInputElement).value = preset.textColor;

  if (preset.mode === "scatter") {
    setActiveTab("scatter");
    (document.getElementById("primaryText") as HTMLInputElement).value = preset.primaryText;
    (document.getElementById("insetText") as HTMLInputElement).value = preset.insetText;
    (document.getElementById("primaryFontSize") as HTMLInputElement).value = String(preset.primaryFontSize);
    (document.getElementById("insetRatio") as HTMLInputElement).value = String(preset.insetFontSizeRatio);
    (document.getElementById("density") as HTMLInputElement).value = String(preset.density);
    (document.getElementById("overlap") as HTMLInputElement).value = String(preset.overlap);
    (document.getElementById("rotMin") as HTMLInputElement).value = String(preset.rotationMin);
    (document.getElementById("rotMax") as HTMLInputElement).value = String(preset.rotationMax);
    (document.getElementById("rotJitter") as HTMLInputElement).value = String(preset.rotationJitter);
    (document.getElementById("seed") as HTMLInputElement).value = String(preset.seed);
    populateFontSelect("fontFamily", "fontStyle", "Times New Roman");
    populateFontSelect("insetFontFamily", "insetFontStyle", "Inter");
  } else {
    setActiveTab("weave");
    (document.getElementById("stringA") as HTMLInputElement).value = preset.stringA;
    (document.getElementById("stringB") as HTMLInputElement).value = preset.stringB;
    (document.getElementById("weaveFontSize") as HTMLInputElement).value = String(preset.fontSize);
    (document.getElementById("rowGap") as HTMLInputElement).value = String(preset.rowGap);
    (document.getElementById("rowOffset") as HTMLInputElement).value = String(preset.rowOffset);
    (document.getElementById("letterSpacing") as HTMLInputElement).value = String(preset.letterSpacing);
    (document.getElementById("flipRows") as HTMLInputElement).checked = preset.flipRows;
    populateFontSelect("fontFamily", "fontStyle", "Inter");
  }
}

function setActiveTab(tab: TabMode): void {
  activeTab = tab;
  document.querySelectorAll(".tab").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-tab") === tab);
  });
  document.querySelectorAll(".panel").forEach((el) => {
    el.classList.toggle("active", el.id === `${tab}-panel`);
  });
}

function buildConfig(): PatternConfig {
  const base = {
    name: val("name") || "Pattern",
    width: num("width"),
    height: num("height"),
    backgroundColor: val("bgColor"),
    textColor: val("textColor"),
  };

  if (activeTab === "scatter") {
    const config: ScatterConfig = {
      ...base,
      mode: "scatter",
      primaryText: val("primaryText"),
      insetText: val("insetText"),
      primaryFont: getFont("fontFamily", "fontStyle"),
      insetFont: getFont("insetFontFamily", "insetFontStyle"),
      primaryFontSize: num("primaryFontSize"),
      insetFontSizeRatio: num("insetRatio"),
      density: num("density"),
      overlap: num("overlap"),
      rotationMin: num("rotMin"),
      rotationMax: num("rotMax"),
      rotationJitter: num("rotJitter"),
      seed: num("seed"),
    };
    return config;
  }

  const config: WeaveConfig = {
    ...base,
    mode: "weave",
    stringA: val("stringA"),
    stringB: val("stringB"),
    font: getFont("fontFamily", "fontStyle"),
    fontSize: num("weaveFontSize"),
    rowGap: num("rowGap"),
    rowOffset: num("rowOffset"),
    letterSpacing: num("letterSpacing"),
    flipRows: checked("flipRows"),
  };
  return config;
}

function init(): void {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.getAttribute("data-tab") as TabMode);
    });
  });

  (document.getElementById("preset") as HTMLSelectElement).onchange = (e) => {
    applyPreset((e.target as HTMLSelectElement).value);
  };

  (document.getElementById("generate") as HTMLButtonElement).onclick = () => {
    const btn = document.getElementById("generate") as HTMLButtonElement;
    btn.disabled = true;
    setStatus("Generating…");
    parent.postMessage({ pluginMessage: { type: "generate", config: buildConfig() } }, "*");
  };

  window.onmessage = (event: MessageEvent) => {
    const msg = event.data.pluginMessage as PluginToUiMessage | undefined;
    if (!msg) return;

    if (msg.type === "fonts") {
      fonts = msg.fonts;
      populateFontSelect("fontFamily", "fontStyle");
      populateFontSelect("insetFontFamily", "insetFontStyle");
      setStatus(`${fonts.length} fonts available. Choose settings and generate.`);
      return;
    }

    const btn = document.getElementById("generate") as HTMLButtonElement;
    btn.disabled = false;

    if (msg.type === "done") {
      setStatus(`Created pattern (${msg.nodeCount} layers).`, "success");
    } else if (msg.type === "warning") {
      setStatus(msg.message, "warning");
    } else if (msg.type === "error") {
      setStatus(msg.message, "error");
    }
  };

  parent.postMessage({ pluginMessage: { type: "get-fonts" } }, "*");
}

init();
