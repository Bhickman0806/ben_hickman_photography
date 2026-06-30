import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const watch = process.argv.includes("--watch");

mkdirSync("dist", { recursive: true });

const uiHtmlTemplate = readFileSync("src/ui.html", "utf8");

const buildUi = async () => {
  const result = await esbuild.build({
    entryPoints: ["src/ui.ts"],
    bundle: true,
    write: false,
    format: "iife",
    target: "es2020",
  });
  const js = result.outputFiles[0].text;
  const html = uiHtmlTemplate.replace(
    "<!-- SCRIPT -->",
    `<script>${js}</script>`
  );
  writeFileSync("dist/ui.html", html);
  return html;
};

const buildCode = async (uiHtml) => {
  await esbuild.build({
    entryPoints: ["src/code.ts"],
    bundle: true,
    outfile: "dist/code.js",
    format: "iife",
    target: "es2020",
    define: {
      __html__: JSON.stringify(uiHtml),
    },
  });
};

const build = async () => {
  const uiHtml = await buildUi();
  await buildCode(uiHtml);
  console.log("Build complete.");
};

if (watch) {
  const rebuild = async () => {
    const uiHtml = await buildUi();
    await buildCode(uiHtml);
    console.log("Rebuilt.");
  };
  await rebuild();
  esbuild.context({
    entryPoints: ["src/ui.ts"],
    bundle: true,
    write: false,
    format: "iife",
    target: "es2020",
    plugins: [
      {
        name: "rebuild-all",
        setup(build) {
          build.onEnd(() => rebuild());
        },
      },
    ],
  }).then((ctx) => ctx.watch());
  esbuild.context({
    entryPoints: ["src/code.ts"],
    bundle: true,
    outfile: "dist/code.js",
    format: "iife",
    target: "es2020",
  }).then((ctx) => ctx.watch());
  console.log("Watching...");
} else {
  await build();
}
