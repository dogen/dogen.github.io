#!/bin/bash
# Build script: Quartz + static pages
# Outputs everything to public/ for GitHub Pages

set -e

echo "🦨 Building builder.xyz..."

# Step 1: Build Quartz
echo "  → Running Quartz build..."
npx quartz build

# Step 2: Copy static pages to public/
echo "  → Copying static landing and pro section..."
cp static-pages/index.html public/
cp static-pages/landing.css public/
mkdir -p public/pro
cp static-pages/pro/index.html public/pro/
cp static-pages/pro/style.css public/pro/
cp static-pages/pro/portrait.jpg public/pro/
# The landing intro only; the other rendered videos in media/ stay out of the site
mkdir -p public/media
cp static-pages/media/hypermodern-intro.mp4 static-pages/media/hypermodern-intro.jpg public/media/

# Note: Quartz's content/index.md outputs to public/index.html
# but gets overwritten by our landing page.
# The personal site entry point is /garden/ (content/garden.md)

echo "✓ Build complete. Output in public/"
echo ""
echo "Site structure:"
echo "  /         → Landing (intro film, then choose pro | personal)"
echo "  /pro/     → Professional (Austin Fay)"
echo "  /garden/  → Personal entry point (The Workshop)"
echo "  /reading/ → Reading log"
echo "  /interesting/ → Interesting links and talks"