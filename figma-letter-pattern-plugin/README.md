# Letter Pattern Generator

A Figma plugin for creating typographic letter patterns — a design exploration tool for scatter and weave layouts inspired by editorial type treatments.

**Target file:** [Letter-Pattern-Generator](https://www.figma.com/design/5GRETOHIKZXgXfiIZaZ7QT/Letter-Pattern-Generator)

## Pattern modes

### Scatter

Large primary letters scattered across a frame with rotation variance and overlap. Optional inset text (e.g. `CAFÉ`) is centered inside round counters (`O`, `D`, `Q`, `P`, `B`).

Inspired by the ORIGIN / CAFÉ reference pattern.

### Weave

Two strings tile horizontally in alternating rows with a 4-row flip cycle:

1. String A — upright
2. String B — upright
3. String B — upside down
4. String A — upside down

Rows use tight leading and horizontal offset for a woven, rhythmic texture.

Inspired by the GINORI 1735 / DOMUS 1735 reference pattern.

## Install

1. Open a terminal in this directory:

   ```bash
   cd figma-letter-pattern-plugin
   npm install
   npm run build
   ```

2. In Figma Desktop: **Plugins → Development → Import plugin from manifest…**

3. Select `figma-letter-pattern-plugin/manifest.json`

4. Open the [Letter-Pattern-Generator](https://www.figma.com/design/5GRETOHIKZXgXfiIZaZ7QT/Letter-Pattern-Generator) file

5. Run **Letter Pattern Generator** from the Plugins menu

## Development

```bash
npm run watch   # rebuild on save
```

After changing source files, re-import or reload the plugin in Figma (Plugins → Development → your plugin).

## Presets

| Preset | Mode | Description |
|--------|------|-------------|
| Origin Café | Scatter | Salmon background, burgundy text, `ORIGIN` with `CAFÉ` inset |
| Ginori Weave | Weave | Green background, black text, alternating brand rows |
| Portfolio Dark | Scatter | Dark background, light text — aligned with site tokens |

## Controls

**Shared:** frame size, background color, text color, font family/style, pattern name

**Scatter:** primary letters, inset text, font sizes, density, overlap, rotation range, seed

**Weave:** string A/B, font size, row gap, row offset, letter spacing, flip-rows toggle

## Output

Each generation creates a new frame on the current page:

- `Pattern / Scatter / {name}`
- `Pattern / Weave / {name}`

All text layers remain fully editable in Figma after generation.

## Notes

- Fonts must be available in the current Figma file. The plugin lists fonts via `listAvailableFontsAsync`.
- Scatter mode caps at 200 text nodes to keep Figma responsive. Reduce density or frame size if you hit the limit.
- Inset text alignment varies by typeface — tweak position manually after generating if needed.

## File structure

```
figma-letter-pattern-plugin/
├── manifest.json
├── package.json
├── esbuild.config.mjs
├── src/
│   ├── code.ts           # Plugin sandbox entry
│   ├── ui.html / ui.ts   # Plugin panel
│   ├── patterns/         # Scatter + weave generators
│   ├── utils/            # Fonts, colors, seeded RNG
│   └── types.ts
└── dist/                 # Built plugin (code.js + ui.html)
```
