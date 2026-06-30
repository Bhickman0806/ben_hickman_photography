import type { ScatterConfig } from "../types";
import { SCATTER_MAX_NODES } from "../types";
import { solidFill } from "../utils/colors";
import { createSeededRandom, randomBetween } from "../utils/random";
import { loadFonts } from "../utils/fonts";

const INSET_CHARS = new Set(["O", "D", "Q", "P", "B"]);

function applyRotation(node: SceneNode, degrees: number): void {
  if (!("rotation" in node)) return;
  (node as LayoutMixin & BlendMixin).rotation = degrees;
}

export async function generateScatterPattern(
  config: ScatterConfig
): Promise<{ frame: FrameNode; nodeCount: number; warning?: string }> {
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

  const cellSize =
    config.primaryFontSize * (1 - config.overlap) * (1 / config.density);
  const cols = Math.ceil(config.width / cellSize) + 1;
  const rows = Math.ceil(config.height / cellSize) + 1;
  const totalCells = cols * rows;

  let warning: string | undefined;
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

      const rotation =
        randomBetween(rng, config.rotationMin, config.rotationMax) +
        randomBetween(rng, -config.rotationJitter, config.rotationJitter);

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

      if (
        config.insetText &&
        INSET_CHARS.has(char) &&
        config.insetFont
      ) {
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
