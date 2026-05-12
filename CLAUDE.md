# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive 3D portfolio website ("Neon Drift Portfolio") built with React Three Fiber. The user controls a robotic dog avatar that walks around a factory-themed 3D world, approaching zones that display portfolio sections (projects, experience, education, etc.).

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build` (runs `tsc && vite build`)
- **Preview production build:** `npm run preview`

No test framework is configured.

## Tech Stack

- React 18 + TypeScript, bundled with Vite
- Three.js via `@react-three/fiber` and `@react-three/drei`
- Tailwind CSS (loaded via CDN in `index.html`, **not** PostCSS pipeline — the installed tailwindcss devDep is unused at runtime)
- Markdown rendering with `react-markdown`

## Architecture

**Entry flow:** `index.html` → `index.tsx` → `App.tsx`

**App.tsx** is the main orchestrator. It manages:
- A `<Canvas>` with the 3D scene (factory world, zones, robotic dog, stars)
- UI overlays rendered outside the canvas (HUD, terminal, mobile controls)
- Two interaction modes: `TELEOP` (manual keyboard/joystick) and `AUTO` (teleport via HUD)
- Zone proximity detection via `InteractionManager` (runs in `useFrame` loop)

**Key components:**
- `RoboticDog.tsx` — Player avatar. Loads a GLTF model (`/models/walking_robotic_dog_draco.glb`), handles physics (gravity, ground collision via raycasting), keyboard/mobile controls, camera follow, and teleportation. This is the most complex component.
- `FactoryWorld.tsx` — Loads the factory environment GLTF (`/models/factory_2_draco.glb`), auto-scales and centers it, fixes material properties.
- `Zone.tsx` — Renders interactive portfolio zone markers in 3D space.
- `TerminalLanding.tsx` — Boot-up terminal overlay; user selects TELEOP or AUTO mode.
- `HudNavigation.tsx` — Top navigation bar with checkpoint buttons for teleporting to zones.
- `UIOverlay.tsx` — Speed indicator, zone proximity prompts, and zone detail panels (renders markdown for project READMEs).
- `MobileControls.tsx` / `MobilePanTilt.tsx` — Touch joystick and camera controls for mobile.

**Data flow:**
- `services/portfolioData.ts` — All portfolio content as a `PortfolioSection[]` array. Each section has a 3D `position` and array of `PortfolioItem`s.
- `types.ts` — Shared types (`PortfolioSection`, `PortfolioItem`, `CarControls`).
- `constants.ts` — Physics tuning (acceleration, speed, friction, camera params) and map dimensions.

**Hooks:**
- `useControls.ts` — Keyboard input (WASD/arrows) → `CarControls` state
- `useIsMobile.ts` — Responsive breakpoint detection
- `useMobileTurnAmount.ts` — Reads global `window.__mobileTurnAmount` for analog joystick input

**Static assets in `public/`:**
- `models/` — GLTF/GLB 3D models (Draco compressed)
- `images/` — Project thumbnails
- `projects/` — Markdown files for detailed project descriptions
- `cv.pdf` — Resume/CV

## Key Patterns

- Mobile controls communicate via `window.__mobileTurnAmount` global (set by `MobileControls`, read by `RoboticDog`)
- The `positionRef` (a `useRef<Vector3>`) is shared between `App`, `RoboticDog`, and `InteractionManager` to avoid re-renders on every frame
- Tailwind custom colors: `safety-yellow` (#F2C94C), `deep-slate` (#121212), `concrete` (#2C2C2C), `off-white` (#E0E0E0) — configured in `index.html`
- Fonts: Rajdhani (headings), Roboto (body), Space Mono (code) — loaded via Google Fonts in `index.html`
- Path alias `@/*` maps to project root (configured in `tsconfig.json`)
