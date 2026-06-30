import type { FontName, WeaveConfig } from "../types";
import { solidFill } from "../utils/colors";
import { loadFonts } from "../utils/fonts";

type RowSpec = {
  text: string;
  rotation: number;
};

function buildRowCycle(config: WeaveConfig): RowSpec[] {
  if (!config.flipRows) {
    return [
      { text: config.stringA, rotation: 0 },
      { text: config.stringB, rotation: 0 },
    ];
  }
  return [
    { text: config.stringA, rotation: 0 },
    { text: config.stringB, rotation: 0 },
    { text: config.stringB, rotation: 180 },
    { text: config.stringA, rotation: 180 },
  ];
}

function createRepeatedText(
  phrase: string,
  font: FontName,
  fontSize: number,
  color: string,
  letterSpacing: number,
  targetWidth: number
): { node: TextNode; width: number } {
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

export async function generateWeavePattern(
  config: WeaveConfig
): Promise<{ frame: FrameNode; nodeCount: number }> {
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

    const offsetX =
      (rowIndex * config.rowOffset) % (textNode.width * 0.5 || 1);
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
