"use strict";
(() => {
  // src/types.ts
  var SCATTER_MAX_NODES = 200;

  // src/utils/colors.ts
  function hexToRgb(hex) {
    const cleaned = hex.replace("#", "").trim();
    const full = cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned;
    const num = parseInt(full, 16);
    if (Number.isNaN(num)) {
      return { r: 0, g: 0, b: 0 };
    }
    return {
      r: (num >> 16 & 255) / 255,
      g: (num >> 8 & 255) / 255,
      b: (num & 255) / 255
    };
  }
  function solidFill(hex) {
    return { type: "SOLID", color: hexToRgb(hex) };
  }

  // src/utils/random.ts
  function createSeededRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state = state + 1831565813 | 0;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function randomBetween(rng, min, max) {
    return min + rng() * (max - min);
  }

  // src/utils/fonts.ts
  async function loadFonts(fonts) {
    const seen = /* @__PURE__ */ new Set();
    for (const font of fonts) {
      const key = `${font.family}::${font.style}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await figma.loadFontAsync(font);
    }
  }
  async function listFonts() {
    const fonts = await figma.listAvailableFontsAsync();
    return fonts.map((f) => f.fontName);
  }

  // src/patterns/scatter.ts
  var INSET_CHARS = /* @__PURE__ */ new Set(["O", "D", "Q", "P", "B"]);
  function applyRotation(node, degrees) {
    if (!("rotation" in node)) return;
    node.rotation = degrees;
  }
  async function generateScatterPattern(config) {
    const rng = createSeededRandom(config.seed);
    const fontsToLoad = [config.primaryFont];
    if (config.insetText && config.insetFont) {
      fontsToLoad.push(config.insetFont);
    }
    await loadFonts(fontsToLoad);
    const frame = figma.createFrame();
    frame.name = `Pattern / Scatter / ${config.name}`;
    frame.resize(config.width, config.height);
    frame.fills = [solidFill(config.backgroundColor)];
    frame.clipsContent = true;
    const cellSize = config.primaryFontSize * (1 - config.overlap) * (1 / config.density);
    const cols = Math.ceil(config.width / cellSize) + 1;
    const rows = Math.ceil(config.height / cellSize) + 1;
    const totalCells = cols * rows;
    let warning;
    if (totalCells > SCATTER_MAX_NODES) {
      warning = `Density would create ${totalCells} nodes (max ${SCATTER_MAX_NODES}). Reduce density or frame size.`;
      throw new Error(warning);
    }
    const lettersGroup = figma.createFrame();
    lettersGroup.name = "Letters";
    lettersGroup.fills = [];
    lettersGroup.clipsContent = false;
    lettersGroup.layoutMode = "NONE";
    frame.appendChild(lettersGroup);
    let charIndex = 0;
    let nodeCount = 0;
    const primaryChars = config.primaryText.toUpperCase() || "A";
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const char = primaryChars[charIndex % primaryChars.length];
        charIndex++;
        const jitterX = randomBetween(rng, -cellSize * 0.3, cellSize * 0.3);
        const jitterY = randomBetween(rng, -cellSize * 0.3, cellSize * 0.3);
        const x = col * cellSize + jitterX - cellSize * 0.5;
        const y = row * cellSize + jitterY - cellSize * 0.5;
        const rotation = randomBetween(rng, config.rotationMin, config.rotationMax) + randomBetween(rng, -config.rotationJitter, config.rotationJitter);
        const letterNode = figma.createText();
        letterNode.name = char;
        letterNode.fontName = config.primaryFont;
        letterNode.fontSize = config.primaryFontSize;
        letterNode.characters = char;
        letterNode.fills = [solidFill(config.textColor)];
        letterNode.x = x;
        letterNode.y = y;
        applyRotation(letterNode, rotation);
        lettersGroup.appendChild(letterNode);
        nodeCount++;
        if (config.insetText && INSET_CHARS.has(char) && config.insetFont) {
          const insetSize = config.primaryFontSize * config.insetFontSizeRatio;
          const insetNode = figma.createText();
          insetNode.name = `inset-${char}`;
          insetNode.fontName = config.insetFont;
          insetNode.fontSize = insetSize;
          insetNode.characters = config.insetText;
          insetNode.fills = [solidFill(config.textColor)];
          insetNode.textAlignHorizontal = "CENTER";
          insetNode.textAlignVertical = "CENTER";
          const centerX = x + letterNode.width / 2 - insetNode.width / 2;
          const centerY = y + letterNode.height * 0.42 - insetNode.height / 2;
          insetNode.x = centerX;
          insetNode.y = centerY;
          applyRotation(insetNode, rotation);
          lettersGroup.appendChild(insetNode);
          nodeCount++;
        }
      }
    }
    lettersGroup.resize(config.width, config.height);
    return { frame, nodeCount, warning };
  }

  // src/patterns/weave.ts
  function buildRowCycle(config) {
    if (!config.flipRows) {
      return [
        { text: config.stringA, rotation: 0 },
        { text: config.stringB, rotation: 0 }
      ];
    }
    return [
      { text: config.stringA, rotation: 0 },
      { text: config.stringB, rotation: 0 },
      { text: config.stringB, rotation: 180 },
      { text: config.stringA, rotation: 180 }
    ];
  }
  function createRepeatedText(phrase, font, fontSize, color, letterSpacing, targetWidth) {
    let repeated = phrase;
    const measure = figma.createText();
    measure.fontName = font;
    measure.fontSize = fontSize;
    measure.characters = repeated;
    measure.letterSpacing = { value: letterSpacing, unit: "PIXELS" };
    while (measure.width < targetWidth + measure.width * 0.5) {
      repeated += "  " + phrase;
      measure.characters = repeated;
    }
    const textNode = figma.createText();
    textNode.fontName = font;
    textNode.fontSize = fontSize;
    textNode.characters = repeated;
    textNode.letterSpacing = { value: letterSpacing, unit: "PIXELS" };
    textNode.fills = [solidFill(color)];
    measure.remove();
    return { node: textNode, width: textNode.width };
  }
  async function generateWeavePattern(config) {
    await loadFonts([config.font]);
    const frame = figma.createFrame();
    frame.name = `Pattern / Weave / ${config.name}`;
    frame.resize(config.width, config.height);
    frame.fills = [solidFill(config.backgroundColor)];
    frame.clipsContent = true;
    const rowsGroup = figma.createFrame();
    rowsGroup.name = "Rows";
    rowsGroup.fills = [];
    rowsGroup.clipsContent = false;
    rowsGroup.layoutMode = "NONE";
    frame.appendChild(rowsGroup);
    const cycle = buildRowCycle(config);
    let nodeCount = 0;
    let y = -config.fontSize * 0.2;
    let rowIndex = 0;
    const sampleRow = createRepeatedText(
      config.stringA,
      config.font,
      config.fontSize,
      config.textColor,
      config.letterSpacing,
      config.width
    );
    const rowHeight = config.fontSize + config.rowGap;
    sampleRow.node.remove();
    while (y < config.height + rowHeight) {
      const spec = cycle[rowIndex % cycle.length];
      const rowFrame = figma.createFrame();
      rowFrame.name = `Row ${rowIndex + 1}`;
      rowFrame.fills = [];
      rowFrame.clipsContent = false;
      rowFrame.layoutMode = "NONE";
      const { node: textNode } = createRepeatedText(
        spec.text,
        config.font,
        config.fontSize,
        config.textColor,
        config.letterSpacing,
        config.width
      );
      const offsetX = rowIndex * config.rowOffset % (textNode.width * 0.5 || 1);
      textNode.x = -offsetX;
      textNode.y = 0;
      if ("rotation" in textNode) {
        textNode.rotation = spec.rotation;
      }
      rowFrame.appendChild(textNode);
      rowFrame.resize(config.width + textNode.width, rowHeight);
      rowFrame.x = 0;
      rowFrame.y = y;
      rowsGroup.appendChild(rowFrame);
      nodeCount += 2;
      y += rowHeight;
      rowIndex++;
    }
    rowsGroup.resize(config.width, config.height);
    return { frame, nodeCount };
  }

  // src/code.ts
  figma.showUI('<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Letter Pattern Generator</title>\n  <style>\n    :root {\n      --bg: var(--figma-color-bg);\n      --text: var(--figma-color-text);\n      --border: var(--figma-color-border);\n      --accent: var(--figma-color-bg-brand);\n      --accent-text: var(--figma-color-text-onbrand);\n      --muted: var(--figma-color-text-secondary);\n    }\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body {\n      font: 11px/1.4 Inter, system-ui, sans-serif;\n      color: var(--text);\n      background: var(--bg);\n      padding: 12px;\n    }\n    h1 { font-size: 13px; font-weight: 600; margin-bottom: 10px; }\n    .tabs { display: flex; gap: 4px; margin-bottom: 12px; }\n    .tab {\n      flex: 1; padding: 6px 8px; border: 1px solid var(--border);\n      background: transparent; color: var(--text); border-radius: 6px;\n      cursor: pointer; font-size: 11px;\n    }\n    .tab.active { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }\n    .panel { display: none; }\n    .panel.active { display: block; }\n    .field { margin-bottom: 10px; }\n    .field label { display: block; font-size: 10px; color: var(--muted); margin-bottom: 3px; }\n    .field input, .field select {\n      width: 100%; padding: 6px 8px; border: 1px solid var(--border);\n      border-radius: 4px; background: var(--bg); color: var(--text); font-size: 11px;\n    }\n    .row { display: flex; gap: 8px; }\n    .row .field { flex: 1; }\n    .actions { margin-top: 14px; display: flex; gap: 8px; }\n    button.primary {\n      flex: 1; padding: 8px; border: none; border-radius: 6px;\n      background: var(--accent); color: var(--accent-text);\n      font-size: 12px; font-weight: 600; cursor: pointer;\n    }\n    button.primary:disabled { opacity: 0.5; cursor: not-allowed; }\n    #status {\n      margin-top: 10px; font-size: 10px; color: var(--muted); min-height: 28px;\n    }\n    #status.error { color: #e03e3e; }\n    #status.warning { color: #c27c00; }\n    #status.success { color: #1a7f37; }\n    .preset-row { margin-bottom: 12px; }\n  </style>\n</head>\n<body>\n  <h1>Letter Pattern Generator</h1>\n\n  <div class="preset-row field">\n    <label for="preset">Preset</label>\n    <select id="preset">\n      <option value="">Custom</option>\n      <option value="originCafe">Origin Caf\xE9</option>\n      <option value="ginoriWeave">Ginori Weave</option>\n      <option value="portfolioDark">Portfolio Dark</option>\n    </select>\n  </div>\n\n  <div class="tabs">\n    <button class="tab active" data-tab="scatter">Scatter</button>\n    <button class="tab" data-tab="weave">Weave</button>\n  </div>\n\n  <div class="shared">\n    <div class="field">\n      <label for="name">Pattern name</label>\n      <input id="name" type="text" value="My Pattern" />\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="width">Width</label>\n        <input id="width" type="number" value="1440" min="100" />\n      </div>\n      <div class="field">\n        <label for="height">Height</label>\n        <input id="height" type="number" value="900" min="100" />\n      </div>\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="bgColor">Background</label>\n        <input id="bgColor" type="text" value="#F29696" />\n      </div>\n      <div class="field">\n        <label for="textColor">Text color</label>\n        <input id="textColor" type="text" value="#3B1E30" />\n      </div>\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="fontFamily">Font family</label>\n        <select id="fontFamily"></select>\n      </div>\n      <div class="field">\n        <label for="fontStyle">Font style</label>\n        <select id="fontStyle"></select>\n      </div>\n    </div>\n  </div>\n\n  <div id="scatter-panel" class="panel active">\n    <div class="field">\n      <label for="primaryText">Primary letters</label>\n      <input id="primaryText" type="text" value="ORIGIN" />\n    </div>\n    <div class="field">\n      <label for="insetText">Inset text (inside O, D, Q\u2026)</label>\n      <input id="insetText" type="text" value="CAF\xC9" />\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="primaryFontSize">Primary size</label>\n        <input id="primaryFontSize" type="number" value="180" min="12" />\n      </div>\n      <div class="field">\n        <label for="insetRatio">Inset ratio</label>\n        <input id="insetRatio" type="number" value="0.14" min="0.05" max="0.4" step="0.01" />\n      </div>\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="density">Density</label>\n        <input id="density" type="number" value="0.55" min="0.2" max="1" step="0.05" />\n      </div>\n      <div class="field">\n        <label for="overlap">Overlap</label>\n        <input id="overlap" type="number" value="0.35" min="0" max="0.8" step="0.05" />\n      </div>\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="rotMin">Rotation min \xB0</label>\n        <input id="rotMin" type="number" value="-60" />\n      </div>\n      <div class="field">\n        <label for="rotMax">Rotation max \xB0</label>\n        <input id="rotMax" type="number" value="-30" />\n      </div>\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="rotJitter">Rotation jitter \xB0</label>\n        <input id="rotJitter" type="number" value="8" min="0" />\n      </div>\n      <div class="field">\n        <label for="seed">Seed</label>\n        <input id="seed" type="number" value="42" />\n      </div>\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="insetFontFamily">Inset font family</label>\n        <select id="insetFontFamily"></select>\n      </div>\n      <div class="field">\n        <label for="insetFontStyle">Inset font style</label>\n        <select id="insetFontStyle"></select>\n      </div>\n    </div>\n  </div>\n\n  <div id="weave-panel" class="panel">\n    <div class="field">\n      <label for="stringA">String A</label>\n      <input id="stringA" type="text" value="GINORI 1735" />\n    </div>\n    <div class="field">\n      <label for="stringB">String B</label>\n      <input id="stringB" type="text" value="DOMUS 1735" />\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="weaveFontSize">Font size</label>\n        <input id="weaveFontSize" type="number" value="48" min="8" />\n      </div>\n      <div class="field">\n        <label for="rowGap">Row gap</label>\n        <input id="rowGap" type="number" value="-8" />\n      </div>\n    </div>\n    <div class="row">\n      <div class="field">\n        <label for="rowOffset">Row offset</label>\n        <input id="rowOffset" type="number" value="120" min="0" />\n      </div>\n      <div class="field">\n        <label for="letterSpacing">Letter spacing</label>\n        <input id="letterSpacing" type="number" value="24" min="0" />\n      </div>\n    </div>\n    <div class="field">\n      <label>\n        <input id="flipRows" type="checkbox" checked />\n        Flip rows (4-row mirror cycle)\n      </label>\n    </div>\n  </div>\n\n  <div class="actions">\n    <button id="generate" class="primary">Generate pattern</button>\n  </div>\n  <div id="status">Loading fonts\u2026</div>\n\n  <script>"use strict";\n(() => {\n  // src/types.ts\n  var PRESETS = {\n    originCafe: {\n      label: "Origin Caf\\xE9",\n      mode: "scatter",\n      name: "Origin Caf\\xE9",\n      width: 1440,\n      height: 900,\n      backgroundColor: "#F29696",\n      textColor: "#3B1E30",\n      primaryText: "ORIGIN",\n      insetText: "CAF\\xC9",\n      primaryFontSize: 180,\n      insetFontSizeRatio: 0.14,\n      density: 0.55,\n      overlap: 0.35,\n      rotationMin: -60,\n      rotationMax: -30,\n      rotationJitter: 8,\n      seed: 42\n    },\n    ginoriWeave: {\n      label: "Ginori Weave",\n      mode: "weave",\n      name: "Ginori Weave",\n      width: 1440,\n      height: 900,\n      backgroundColor: "#4A8F5C",\n      textColor: "#000000",\n      stringA: "GINORI 1735",\n      stringB: "DOMUS 1735",\n      fontSize: 48,\n      rowGap: -8,\n      rowOffset: 120,\n      letterSpacing: 24,\n      flipRows: true\n    },\n    portfolioDark: {\n      label: "Portfolio Dark",\n      mode: "scatter",\n      name: "Portfolio Dark",\n      width: 1440,\n      height: 900,\n      backgroundColor: "#0a0a0a",\n      textColor: "#f0f0f0",\n      primaryText: "FAMILY",\n      insetText: "",\n      primaryFontSize: 200,\n      insetFontSizeRatio: 0.12,\n      density: 0.5,\n      overlap: 0.3,\n      rotationMin: -45,\n      rotationMax: -15,\n      rotationJitter: 10,\n      seed: 7\n    }\n  };\n\n  // src/ui.ts\n  var fonts = [];\n  var activeTab = "scatter";\n  var $ = (id) => document.getElementById(id);\n  var val = (id) => document.getElementById(id).value;\n  var num = (id) => Number(val(id));\n  var checked = (id) => document.getElementById(id).checked;\n  function setStatus(text, kind = "") {\n    const el = $("status");\n    el.textContent = text;\n    el.className = kind;\n  }\n  function uniqueFamilies(list) {\n    return [...new Set(list.map((f) => f.family))].sort();\n  }\n  function stylesForFamily(family) {\n    return fonts.filter((f) => f.family === family).map((f) => f.style).sort();\n  }\n  function populateFontSelect(familyId, styleId, preferredFamily) {\n    const familyEl = document.getElementById(familyId);\n    const styleEl = document.getElementById(styleId);\n    const families = uniqueFamilies(fonts);\n    familyEl.innerHTML = families.map((f) => `<option value="${f}">${f}</option>`).join("");\n    const defaultFamily = preferredFamily && families.includes(preferredFamily) ? preferredFamily : families[0] ?? "";\n    familyEl.value = defaultFamily;\n    const updateStyles = () => {\n      const styles = stylesForFamily(familyEl.value);\n      styleEl.innerHTML = styles.map((s) => `<option value="${s}">${s}</option>`).join("");\n      const regular = styles.find((s) => s.toLowerCase() === "regular");\n      styleEl.value = regular ?? styles[0] ?? "";\n    };\n    familyEl.onchange = updateStyles;\n    updateStyles();\n  }\n  function getFont(familyId, styleId) {\n    return {\n      family: document.getElementById(familyId).value,\n      style: document.getElementById(styleId).value\n    };\n  }\n  function applyPreset(key) {\n    if (!key || !(key in PRESETS)) return;\n    const preset = PRESETS[key];\n    $("name").setAttribute("value", preset.name);\n    document.getElementById("name").value = preset.name;\n    document.getElementById("width").value = String(preset.width);\n    document.getElementById("height").value = String(preset.height);\n    document.getElementById("bgColor").value = preset.backgroundColor;\n    document.getElementById("textColor").value = preset.textColor;\n    if (preset.mode === "scatter") {\n      setActiveTab("scatter");\n      document.getElementById("primaryText").value = preset.primaryText;\n      document.getElementById("insetText").value = preset.insetText;\n      document.getElementById("primaryFontSize").value = String(preset.primaryFontSize);\n      document.getElementById("insetRatio").value = String(preset.insetFontSizeRatio);\n      document.getElementById("density").value = String(preset.density);\n      document.getElementById("overlap").value = String(preset.overlap);\n      document.getElementById("rotMin").value = String(preset.rotationMin);\n      document.getElementById("rotMax").value = String(preset.rotationMax);\n      document.getElementById("rotJitter").value = String(preset.rotationJitter);\n      document.getElementById("seed").value = String(preset.seed);\n      populateFontSelect("fontFamily", "fontStyle", "Times New Roman");\n      populateFontSelect("insetFontFamily", "insetFontStyle", "Inter");\n    } else {\n      setActiveTab("weave");\n      document.getElementById("stringA").value = preset.stringA;\n      document.getElementById("stringB").value = preset.stringB;\n      document.getElementById("weaveFontSize").value = String(preset.fontSize);\n      document.getElementById("rowGap").value = String(preset.rowGap);\n      document.getElementById("rowOffset").value = String(preset.rowOffset);\n      document.getElementById("letterSpacing").value = String(preset.letterSpacing);\n      document.getElementById("flipRows").checked = preset.flipRows;\n      populateFontSelect("fontFamily", "fontStyle", "Inter");\n    }\n  }\n  function setActiveTab(tab) {\n    activeTab = tab;\n    document.querySelectorAll(".tab").forEach((el) => {\n      el.classList.toggle("active", el.getAttribute("data-tab") === tab);\n    });\n    document.querySelectorAll(".panel").forEach((el) => {\n      el.classList.toggle("active", el.id === `${tab}-panel`);\n    });\n  }\n  function buildConfig() {\n    const base = {\n      name: val("name") || "Pattern",\n      width: num("width"),\n      height: num("height"),\n      backgroundColor: val("bgColor"),\n      textColor: val("textColor")\n    };\n    if (activeTab === "scatter") {\n      const config2 = {\n        ...base,\n        mode: "scatter",\n        primaryText: val("primaryText"),\n        insetText: val("insetText"),\n        primaryFont: getFont("fontFamily", "fontStyle"),\n        insetFont: getFont("insetFontFamily", "insetFontStyle"),\n        primaryFontSize: num("primaryFontSize"),\n        insetFontSizeRatio: num("insetRatio"),\n        density: num("density"),\n        overlap: num("overlap"),\n        rotationMin: num("rotMin"),\n        rotationMax: num("rotMax"),\n        rotationJitter: num("rotJitter"),\n        seed: num("seed")\n      };\n      return config2;\n    }\n    const config = {\n      ...base,\n      mode: "weave",\n      stringA: val("stringA"),\n      stringB: val("stringB"),\n      font: getFont("fontFamily", "fontStyle"),\n      fontSize: num("weaveFontSize"),\n      rowGap: num("rowGap"),\n      rowOffset: num("rowOffset"),\n      letterSpacing: num("letterSpacing"),\n      flipRows: checked("flipRows")\n    };\n    return config;\n  }\n  function init() {\n    document.querySelectorAll(".tab").forEach((tab) => {\n      tab.addEventListener("click", () => {\n        setActiveTab(tab.getAttribute("data-tab"));\n      });\n    });\n    document.getElementById("preset").onchange = (e) => {\n      applyPreset(e.target.value);\n    };\n    document.getElementById("generate").onclick = () => {\n      const btn = document.getElementById("generate");\n      btn.disabled = true;\n      setStatus("Generating\\u2026");\n      parent.postMessage({ pluginMessage: { type: "generate", config: buildConfig() } }, "*");\n    };\n    window.onmessage = (event) => {\n      const msg = event.data.pluginMessage;\n      if (!msg) return;\n      if (msg.type === "fonts") {\n        fonts = msg.fonts;\n        populateFontSelect("fontFamily", "fontStyle");\n        populateFontSelect("insetFontFamily", "insetFontStyle");\n        setStatus(`${fonts.length} fonts available. Choose settings and generate.`);\n        return;\n      }\n      const btn = document.getElementById("generate");\n      btn.disabled = false;\n      if (msg.type === "done") {\n        setStatus(`Created pattern (${msg.nodeCount} layers).`, "success");\n      } else if (msg.type === "warning") {\n        setStatus(msg.message, "warning");\n      } else if (msg.type === "error") {\n        setStatus(msg.message, "error");\n      }\n    };\n    parent.postMessage({ pluginMessage: { type: "get-fonts" } }, "*");\n  }\n  init();\n})();\n<\/script>\n</body>\n</html>\n', { width: 340, height: 620, themeColors: true });
  function post(message) {
    figma.ui.postMessage(message);
  }
  function centerOnViewport(node) {
    const center = figma.viewport.center;
    node.x = center.x - node.width / 2;
    node.y = center.y - node.height / 2;
  }
  async function handleGenerate(config) {
    let result;
    if (config.mode === "scatter") {
      result = await generateScatterPattern(config);
    } else {
      result = await generateWeavePattern(config);
    }
    figma.currentPage.appendChild(result.frame);
    centerOnViewport(result.frame);
    figma.currentPage.selection = [result.frame];
    figma.viewport.scrollAndZoomIntoView([result.frame]);
    if (result.warning) {
      post({ type: "warning", message: result.warning });
    }
    post({ type: "done", nodeId: result.frame.id, nodeCount: result.nodeCount });
  }
  figma.ui.onmessage = async (msg) => {
    try {
      if (msg.type === "get-fonts") {
        const fonts = await listFonts();
        post({ type: "fonts", fonts });
        return;
      }
      if (msg.type === "cancel") {
        figma.closePlugin();
        return;
      }
      if (msg.type === "generate") {
        await handleGenerate(msg.config);
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      post({ type: "error", message });
    }
  };
  listFonts().then((fonts) => post({ type: "fonts", fonts }));
})();
