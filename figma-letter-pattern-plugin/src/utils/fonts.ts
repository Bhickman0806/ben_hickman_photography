import type { FontName } from "../types";

export async function loadFonts(fonts: FontName[]): Promise<void> {
  const seen = new Set<string>();
  for (const font of fonts) {
    const key = `${font.family}::${font.style}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await figma.loadFontAsync(font);
  }
}

export function findFont(
  available: FontName[],
  preferredFamily: string,
  preferredStyle = "Regular"
): FontName | null {
  const exact = available.find(
    (f) =>
      f.family === preferredFamily &&
      f.style.toLowerCase() === preferredStyle.toLowerCase()
  );
  if (exact) return exact;

  const familyMatch = available.find((f) => f.family === preferredFamily);
  if (familyMatch) return familyMatch;

  const partial = available.find((f) =>
    f.family.toLowerCase().includes(preferredFamily.toLowerCase())
  );
  return partial ?? null;
}

export function findSerifFont(available: FontName[]): FontName | null {
  const serifKeywords = ["serif", "times", "georgia", "garamond", "instrument"];
  for (const keyword of serifKeywords) {
    const match = available.find((f) =>
      f.family.toLowerCase().includes(keyword)
    );
    if (match) return match;
  }
  return available[0] ?? null;
}

export function findSansFont(available: FontName[]): FontName | null {
  const sansKeywords = ["inter", "helvetica", "arial", "futura", "sans"];
  for (const keyword of sansKeywords) {
    const match = available.find((f) =>
      f.family.toLowerCase().includes(keyword)
    );
    if (match) return match;
  }
  return available[0] ?? null;
}

export async function listFonts(): Promise<FontName[]> {
  const fonts = await figma.listAvailableFontsAsync();
  return fonts.map((f) => f.fontName);
}
