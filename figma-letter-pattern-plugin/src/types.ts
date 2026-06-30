export type FontName = { family: string; style: string };

export type ScatterConfig = {
  mode: "scatter";
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  primaryText: string;
  insetText: string;
  primaryFont: FontName;
  insetFont: FontName;
  primaryFontSize: number;
  insetFontSizeRatio: number;
  density: number;
  overlap: number;
  rotationMin: number;
  rotationMax: number;
  rotationJitter: number;
  seed: number;
};

export type WeaveConfig = {
  mode: "weave";
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  stringA: string;
  stringB: string;
  font: FontName;
  fontSize: number;
  rowGap: number;
  rowOffset: number;
  letterSpacing: number;
  flipRows: boolean;
};

export type PatternConfig = ScatterConfig | WeaveConfig;

export type UiToPluginMessage =
  | { type: "get-fonts" }
  | { type: "generate"; config: PatternConfig }
  | { type: "cancel" };

export type PluginToUiMessage =
  | { type: "fonts"; fonts: FontName[] }
  | { type: "done"; nodeId: string; nodeCount: number }
  | { type: "error"; message: string }
  | { type: "warning"; message: string };

export const SCATTER_MAX_NODES = 200;

export const PRESETS = {
  originCafe: {
    label: "Origin Café",
    mode: "scatter" as const,
    name: "Origin Café",
    width: 1440,
    height: 900,
    backgroundColor: "#F29696",
    textColor: "#3B1E30",
    primaryText: "ORIGIN",
    insetText: "CAFÉ",
    primaryFontSize: 180,
    insetFontSizeRatio: 0.14,
    density: 0.55,
    overlap: 0.35,
    rotationMin: -60,
    rotationMax: -30,
    rotationJitter: 8,
    seed: 42,
  },
  ginoriWeave: {
    label: "Ginori Weave",
    mode: "weave" as const,
    name: "Ginori Weave",
    width: 1440,
    height: 900,
    backgroundColor: "#4A8F5C",
    textColor: "#000000",
    stringA: "GINORI 1735",
    stringB: "DOMUS 1735",
    fontSize: 48,
    rowGap: -8,
    rowOffset: 120,
    letterSpacing: 24,
    flipRows: true,
  },
  portfolioDark: {
    label: "Portfolio Dark",
    mode: "scatter" as const,
    name: "Portfolio Dark",
    width: 1440,
    height: 900,
    backgroundColor: "#0a0a0a",
    textColor: "#f0f0f0",
    primaryText: "FAMILY",
    insetText: "",
    primaryFontSize: 200,
    insetFontSizeRatio: 0.12,
    density: 0.5,
    overlap: 0.3,
    rotationMin: -45,
    rotationMax: -15,
    rotationJitter: 10,
    seed: 7,
  },
};
