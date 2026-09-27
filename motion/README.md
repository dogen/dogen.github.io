# Landing page motion

Three looping motion-graphics pieces for the landing page (`static-pages/index.html`), each built
from the site's own copy:

| Scene         | Look                                                           | Loop | fps |
| ------------- | -------------------------------------------------------------- | ---- | --- |
| `cyberpunk`   | night-city access terminal, neon doors, glitch, CRT power-off  | 13s  | 30  |
| `analog`      | 16mm leader, colour bars, 70s channel slates, film grain       | 12s  | 24  |
| `hypermodern` | Swiss grid, kinetic type, glass, 3D point clouds, cursor hover | 12s  | 60  |

Rendered files live in `static-pages/media/` (`<scene>.mp4` plus a `<scene>.jpg` poster). They are
**not deployed yet**: `build.sh` doesn't copy `media/`, so the live site is unchanged until the
landing page references them.

## Preview

Open `preview.html` in a browser to watch the rendered videos side by side. Each file in `scenes/`
also plays live on its own. They are canvas code, so they can be edited and refreshed.

## Re-render

Needs Node 22+, ffmpeg on the PATH, and Microsoft Edge (or set `BROWSER_PATH` to any Chromium).

```bash
cd motion
npm install
npm run render               # all three
npm run render -- analog     # just one
```

Every scene is a pure function of time (`draw(ctx, t)`) with no `Math.random()`, so a re-render
draws the same frames and each loop ends where it begins.
