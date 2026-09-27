# Landing page motion

Three looping motion-graphics pieces for the landing page (`static-pages/index.html`), each built
from the site's own copy:

| Scene         | Look                                                           | Loop | fps |
| ------------- | -------------------------------------------------------------- | ---- | --- |
| `cyberpunk`   | night-city access terminal, neon doors, glitch, CRT power-off  | 13s  | 30  |
| `analog`      | 16mm leader, colour bars, 70s channel slates, film grain       | 12s  | 24  |
| `hypermodern` | Swiss grid, kinetic type, glass, 3D point clouds, cursor hover | 12s  | 60  |

Rendered files live in `static-pages/media/` (`<name>.mp4` plus a `<name>.jpg` poster).

**Live on the site:** `hypermodern-intro`, a cut of `hypermodern` (`?cut=intro`) that stops once
the ink ripple fills the frame instead of wiping back to paper. The landing page plays it full
screen once per session and dissolves from its last, near-black frame into the doors. `build.sh`
copies only that cut; the three loops stay in the repo.

## Preview

Open `preview.html` in a browser to watch the rendered videos side by side. Each file in `scenes/`
also plays live on its own. They are canvas code, so they can be edited and refreshed.

## Re-render

Needs Node 22+, ffmpeg on the PATH, and Microsoft Edge (or set `BROWSER_PATH` to any Chromium).

```bash
cd motion
npm install
npm run render                       # everything
npm run render -- hypermodern-intro  # just one
```

Every scene is a pure function of time (`draw(ctx, t)`) with no `Math.random()`, so a re-render
draws the same frames and each loop ends where it begins.
