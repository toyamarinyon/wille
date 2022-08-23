import { build } from "esbuild";
import { writeFile } from "fs/promises";
import { join } from "path";
import { createHandlerTypeScriptStringOnPage } from "./handler";
import { createHydratingTypeScriptStringOnPage } from "./hydrate";
import { createManifest } from "./manifest";

/**
 * Options for the build command.
 * @param pagesDir - path to the page files directory
 * @param packageDir - path to the package directory
 * @param runtimeDir - path to the runtime directory
 */
interface BuildOption {
  pagesDir: string;
  distDir: string;
  runtimeDir: string;
}
const defaultBuildOption: BuildOption = {
  pagesDir: "src/pages",
  distDir: "dist",
  runtimeDir: "node_modules/$eagle",
};
export async function buildEagleNew(option?: Partial<BuildOption>) {
  const buildOption = { ...defaultBuildOption, ...option };
  const manifest = createManifest(buildOption.pagesDir, buildOption.distDir);

  // Create hydrate code for each page.
  Promise.all(
    manifest.pages.map(async (page) => {
      const hydratingTypeScriptString = createHydratingTypeScriptStringOnPage(
        page.path
      );
      const hydratingTypeScriptFilePath = join(
        buildOption.distDir,
        "tmp",
        page.path.replace(/\//g, "-")
      );
      await writeFile(hydratingTypeScriptFilePath, hydratingTypeScriptString);

      await build({
        entryPoints: [hydratingTypeScriptFilePath],
        jsx: "automatic",
        bundle: true,
        format: "iife",
        loader: { ".ts": "tsx" },
        target: "es2022",
        outdir: join(buildOption.distDir, "public"),
      });
    })
  );

  // Create the handler from the pages
  const handlers = manifest.pages.map((page) => {
    return createHandlerTypeScriptStringOnPage(page.path);
  });
  const runtime = `
  import { handler, PageFile, Eagle, EagleOption, inferAnyZodObject } from "@toyamarinyon/eagle";

  const handlers = {
    ${handlers.join("\n")}
  }

  export function eagle<T = unknown>(option?: EagleOption<inferAnyZodObject<T>>) {
    return new Eagle(handlers, option);
  }
  `;

  await writeFile(join(buildOption.runtimeDir, "index.ts"), runtime);
  await build({
    entryPoints: ["src/index.ts"],
    format: "esm",
    target: "es2022",
    bundle: true,
    minify: true,
    loader: { ".ts": "tsx", ".js": "jsx" },
    jsx: "automatic",
    outfile: "dist/index.mjs",
  });
}
