/* Shared helpers for the builder.xyz motion scenes.
 *
 * A scene is a pure function of time: draw(ctx, t, frame) must paint the same
 * pixels for the same t. That lets render.mjs capture frames one at a time and
 * lets the loop seam be checked by comparing t = 0 with t = duration. Randomness
 * therefore comes from rand(), a hash of integers, never from Math.random().
 *
 * Opened directly in a browser, a scene plays live and loops. Opened with
 * ?render, it waits for render.mjs to call window.renderFrame(t).
 */
;(() => {
  const W = 1920
  const H = 1080

  const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x))
  const lerp = (a, b, k) => a + (b - a) * k
  /** Progress of t through [a, b], clamped to 0..1. */
  const span = (t, a, b) => clamp((t - a) / (b - a))
  /** 1 while a <= t < b, else 0. */
  const within = (t, a, b) => (t >= a && t < b ? 1 : 0)

  const ease = {
    linear: (x) => x,
    inCubic: (x) => x ** 3,
    outCubic: (x) => 1 - (1 - x) ** 3,
    inOutCubic: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
    inExpo: (x) => (x <= 0 ? 0 : 2 ** (10 * x - 10)),
    outExpo: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
    inOutExpo: (x) =>
      x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2,
    outBack: (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
  }

  /** Deterministic 0..1 value from up to three integers. */
  function rand(a, b = 0, c = 0) {
    let h =
      Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1)
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }

  /** Smooth 1-D value noise in -1..1; each seed is an independent curve. */
  function noise(x, seed = 0) {
    const i = Math.floor(x)
    const f = x - i
    return lerp(rand(i, seed, 7), rand(i + 1, seed, 7), f * f * (3 - 2 * f)) * 2 - 1
  }

  /** An offscreen canvas and its context. */
  function layer(w = W, h = H) {
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    return [canvas, canvas.getContext("2d")]
  }

  /** A square tile of grey per-pixel noise, built once from rand(). */
  function noiseTile(size, seed) {
    const [canvas, g] = layer(size, size)
    const img = g.createImageData(size, size)
    for (let i = 0; i < size * size; i++) {
      const v = rand(i, seed, 3) * 255
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
      img.data[i * 4 + 3] = 255
    }
    g.putImageData(img, 0, 0)
    return canvas
  }

  /** The first characters of str, as if typed at cps characters per second from t0. */
  const typed = (str, t, t0, cps) => str.slice(0, Math.max(0, Math.floor((t - t0) * cps)))

  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>/\\|"
  /** Reveal str left to right as k goes 0..1; a short band of scrambled glyphs leads the reveal. */
  function decode(str, k, frame, seed = 0) {
    const done = Math.floor(k * (str.length + 6)) - 6
    let out = ""
    for (let i = 0; i < str.length; i++) {
      if (i < done || str[i] === " ") out += str[i]
      else if (i < done + 6) out += GLYPHS[Math.floor(rand(i, frame >> 1, seed) * GLYPHS.length)]
      else out += " "
    }
    return out
  }

  /** Register a scene: expose the hooks render.mjs drives, or play it live. */
  function scene({ duration, fps, crf = 23, poster = 0, fonts = [], setup, draw }) {
    const canvas = document.querySelector("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")

    window.SCENE = { duration, fps, crf, poster }
    window.ready = (async () => {
      const loaded = await Promise.all(fonts.map((f) => document.fonts.load(f)))
      const missing = fonts.filter((_, i) => loaded[i].length === 0)
      if (missing.length) throw new Error(`fonts failed to load: ${missing.join(", ")}`)
      await document.fonts.ready
      setup?.()
    })()
    window.renderFrame = (t) => {
      ctx.save()
      draw(ctx, t, Math.round(t * fps))
      ctx.restore()
    }

    if (new URLSearchParams(location.search).has("render")) return
    window.ready.then(() => {
      const start = performance.now()
      const tick = (now) => {
        window.renderFrame(((now - start) / 1000) % duration)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  }

  window.M = {
    W,
    H,
    clamp,
    lerp,
    span,
    within,
    ease,
    rand,
    noise,
    layer,
    noiseTile,
    typed,
    decode,
    scene,
  }
})()
