import type { RGB } from "@figma/plugin-typings/plugin-api-standalone";

export function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

export function solidFill(hex: string): SolidPaint {
  return { type: "SOLID", color: hexToRgb(hex) };
}
