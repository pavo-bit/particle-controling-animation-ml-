# J.A.R.V.I.S. Holographic Interface

A dual-hand interactive 3D data manipulation interface running entirely in the browser using Three.js and MediaPipe Tasks Vision.

## Architecture

This experience replaces a traditional multi-file setup with a unified single-file `index.html` structure. The entire application (HTML structure, CSS positioning, MediaPipe tracking, and Three.js rendering) runs from `index.html`, making it extremely easy to host and run.

The old `js/` and `css/` files are legacy and no longer active in this build.

## Core Features

- **Dual-Hand Tracking:** Left hand controls selection, right hand controls manipulation.
- **Holographic 3D Objects:** Rendered using Three.js with a custom Unreal Bloom post-processing effect.
- **JARVIS HUD:** Dynamic HTML/CSS overlay with real-time tracking badges and status indicators.
- **Picture-in-Picture (PIP):** The raw webcam feed and MediaPipe skeleton overlay are drawn explicitly into a PIP window in the corner, leaving the main 3D canvas clean.

## The 4 Data Objects

The scene features four distinct Three.js objects to interact with:
1. **Data Core (Centre):** A spinning wireframe icosahedron with orbiting rings and particle dust.
2. **System Ring (Top-Right):** Interlocking toruses with rotating arc segments.
3. **Neural Map (Left):** A 3D network node graph connected via line segments.
4. **Energy Matrix (Bottom):** A grid of vertical bars pulsating like a 3D audio visualizer.

## Gesture Controls

### ✋ Left Hand: SELECT (Cyan PIP Skeleton) 
Appears on the **left side** of your screen.
- **☝ Point (1 finger):** Projects a reticle to highlight the nearest object.
- **✊ Fist:** Locks the selection (reticle turns green, object glows).
- **✌ 2 fingers:** Quick-shortcut to select the Neural Map.
- **🤟 3 fingers:** Quick-shortcut to select the System Ring.
- **🖖 4 fingers:** Quick-shortcut to select the Energy Matrix.
- **🖐 Open (5 fingers):** Deselect all targets.

### 🤚 Right Hand: MANIPULATE (Gold PIP Skeleton)
Appears on the **right side** of your screen. (Only takes effect when an object is selected).
- **🖐 Open Palm (Rotate):** Maps your palm's X/Y position to rotate the selected 3D object.
- **🤏 Pinch (Scale):** The distance between your thumb and index finger scales the object smoothly up or down.
- **☝ Point (Disturb):** Triggers a "disruption" effect (Energy Matrix bars spike wildly, System Ring arcs spin faster, halos flash).
- **✊ Fist (Idle):** Freezes manipulation, allowing you to hold the object steady.

## How to Run

Because ES Modules and WebGL require a proper origin, you must serve the folder using a local web server:

**Using Python:**
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

> **Note:** When the page loads, allow browser camera access so the AI hand-tracking model can initialize.
