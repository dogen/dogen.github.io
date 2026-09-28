// The site used to live at dogen.github.io/builder.xyz/. GitHub Pages answers any missing
// path with 404.html, so a line at the top of that page sends old links (shared, bookmarked,
// indexed) to the same page at the root: /builder.xyz/garden -> /garden.
//
//   node scripts/redirect-old-links.mjs public
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const file = path.join(process.argv[2] ?? "public", "404.html")
const redirect =
  "<script>if(/^\\/builder\\.xyz(\\/|$)/.test(location.pathname))" +
  'location.replace((location.pathname.replace(/^\\/builder\\.xyz/,"")||"/")+location.search+location.hash)</script>'

try {
  const html = await readFile(file, "utf8")
  if (!html.includes("<head>")) throw new Error("no <head> in 404.html")
  await writeFile(file, html.replace("<head>", `<head>${redirect}`))
  console.log("  → 404: old /builder.xyz/ links redirect to the root")
} catch (e) {
  console.log(`::warning title=Old-link redirect::${e.message}; old /builder.xyz/ links will 404`)
}
