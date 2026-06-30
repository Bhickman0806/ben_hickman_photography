import type { PatternConfig, PluginToUiMessage, UiToPluginMessage } from "./types";
import { generateScatterPattern } from "./patterns/scatter";
import { generateWeavePattern } from "./patterns/weave";
import { listFonts } from "./utils/fonts";

figma.showUI(__html__, { width: 340, height: 620, themeColors: true });

function post(message: PluginToUiMessage): void {
  figma.ui.postMessage(message);
}

function centerOnViewport(node: FrameNode): void {
  const center = figma.viewport.center;
  node.x = center.x - node.width / 2;
  node.y = center.y - node.height / 2;
}

async function handleGenerate(config: PatternConfig): Promise<void> {
  let result: { frame: FrameNode; nodeCount: number; warning?: string };

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

figma.ui.onmessage = async (msg: UiToPluginMessage) => {
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
