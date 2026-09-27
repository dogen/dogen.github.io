// Renders the motion scenes to video for the landing page.
//
//   npm run render                       every video
//   npm run render -- hypermodern-intro  just one
//
// Each scene in scenes/ is stepped frame by frame in headless Edge (or the
// Chromium at $BROWSER_PATH). Frames are piped as PNGs straight into ffmpeg,
// which writes an H.264 MP4 and a poster JPG to ../static-pages/media/.
import { spawn } from "node:child_process"
import { once } from "node:events"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { chromium } from "playwright-core"

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(here, "../static-pages/media")

// Every video we make. A cut renders an existing scene with extra query parameters.
const RENDERS = [
  { name: "cyberpunk" },
  { name: "analog" },
  { name: "hypermodern" },
  { name: "hypermodern-intro", scene: "hypermodern", query: "cut=intro" }, // landing page intro
]
const args = process.argv.slice(2)
const unknown = args.filter((a) => !RENDERS.some((r) => r.name === a))
if (unknown.length) {
  throw new Error(
    `unknown video ${unknown.join(", ")}; pick from ${RENDERS.map((r) => r.name).join(", ")}`,
  )
}
const todo = args.length ? RENDERS.filter((r) => args.includes(r.name)) : RENDERS

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch(
  process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : { channel: "msedge" },
)

try {
  for (const r of todo) await render(r)
} finally {
  await browser.close()
}

async function render({ name, scene = name, query }) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const file = pathToFileURL(path.join(here, "scenes", `${scene}.html`))
  await page.goto(`${file}?render${query ? `&${query}` : ""}`)
  const { duration, fps, crf, poster } = await page.evaluate(async () => {
    await window.ready
    return window.SCENE
  })

  const mp4 = path.join(outDir, `${name}.mp4`)
  // prettier-ignore
  const ffmpeg = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", mp4,
  ], { stdio: ["pipe", "inherit", "inherit"] })
  const exited = once(ffmpeg, "close")

  const frames = Math.round(duration * fps)
  for (let i = 0; i < frames; i++) {
    if (!ffmpeg.stdin.write(await grab(page, i / fps, "image/png"))) {
      await once(ffmpeg.stdin, "drain")
    }
    if (i % fps === 0) process.stdout.write(`\r${name}: ${i}/${frames} frames`)
  }
  ffmpeg.stdin.end()
  const [code] = await exited
  if (code !== 0) throw new Error(`ffmpeg exited with ${code} while encoding ${name}`)

  await writeFile(path.join(outDir, `${name}.jpg`), await grab(page, poster, "image/jpeg"))
  console.log(`\r${name}: ${frames} frames -> ${path.relative(process.cwd(), mp4)}`)
  await page.close()
}

/** Draw the scene at time t and return the canvas encoded as the given image type. */
async function grab(page, t, type) {
  const url = await page.evaluate(
    ([t, type]) => {
      window.renderFrame(t)
      return document.querySelector("canvas").toDataURL(type, 0.86)
    },
    [t, type],
  )
  return Buffer.from(url.slice(url.indexOf(",") + 1), "base64")
}
