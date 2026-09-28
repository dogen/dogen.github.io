// Post-build fixes for the Quartz graph view (quartz-community/graph @ 67ac499).
//
//   node scripts/patch-graph.mjs public
//
// 1. Labels at rest. The plugin creates every node label at alpha 0 and only sets label
//    opacity inside its d3-zoom handler, which never runs until someone zooms, so the graph
//    shows anonymous dots (and a phone has no hover to reveal them). Applying the identity
//    transform right after the zoom behaviour is attached runs that handler once at startup;
//    opacityScale in quartz.config.yaml then decides how visible labels are at 1x.
// 2. Quartz's Tag Index page (tags/index) shows up as a lone "#" node, because the graph
//    strips "index" from its slug. It is dropped from contentIndex.json, which the graph reads.
//
// A fix that no longer finds its target logs a GitHub Actions warning and leaves the file
// alone. The graph just goes back to hover-only labels; the deploy still ships.
import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const out = process.argv[2] ?? "public"
const warn = (msg) => console.log(`::warning title=Graph patch::${msg}`)

// `zoom = d3.zoom()...; d3.select(app.canvas).call(zoom)`, minified. Anchoring on the zoom
// definition matters: the drag behaviour is attached with the same select(canvas).call(x) shape.
const ZOOM = /((\w+)=(\w+)\.zoom\(\)[^;]*;\3\.select\(\w+\.canvas\)\.call\(\2\))/

async function labels() {
  const dir = path.join(out, "static", "scripts")
  let patched = 0
  for (const name of await readdir(dir)) {
    const file = path.join(dir, name)
    const src = await readFile(file, "utf8")
    if (!src.includes("opacityScale") || !ZOOM.test(src)) continue
    await writeFile(file, src.replace(ZOOM, "$1.call($2.transform,$3.zoomIdentity)"))
    patched++
  }
  if (patched === 1) console.log("  → graph: labels visible at rest")
  else
    warn(
      `expected to patch 1 graph script, patched ${patched}; labels will only show on hover or zoom`,
    )
}

async function tagIndex() {
  const file = path.join(out, "static", "contentIndex.json")
  const index = JSON.parse(await readFile(file, "utf8"))
  if (!("tags/index" in index))
    return warn("tags/index is not in contentIndex.json; nothing to drop")
  delete index["tags/index"]
  await writeFile(file, JSON.stringify(index))
  console.log("  → graph: dropped the Tag Index node")
}

for (const fix of [labels, tagIndex]) {
  try {
    await fix()
  } catch (e) {
    warn(`${fix.name}: ${e.message}`)
  }
}
