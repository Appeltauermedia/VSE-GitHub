# VSE Source Layout

This folder is the start of the gradual VSE modularization.

Current migration rule:
- Keep behavior unchanged while moving one bounded system at a time.
- Prefer classic scripts during the transition, because the existing app still relies on shared globals.
- After each extraction, run syntax and browser smoke tests before moving the next module.

Current modules:
- `core/stage.js` - stage scaling and CSS coordinate helpers.
- `core/webgl.js` - shader compile and program link helpers.
- `modules/wind.js` - global wind defaults, per-frame wind state, object wind filtering, and Wind UI binding.
- `io/sceneIO.js` - scene/object import-export helpers.
- `styles/main.css` - application styling extracted from the former inline `<style>` block.
- `app/00-...js` through `app/11-...js` - ordered classic app sections split from the former inline main script.
- `app/00a-hoisted-functions.js` - compatibility hoists for functions that older inline ordering made globally available before their section.
- `render/shaders/particles.js` - universal particle vertex/fragment shader strings.
- `render/shaders/fog.js` - fog shader strings.
- `render/shaders/water.js` - water surface/flow shader strings.
- `render/shaders/background.js` - background shader strings.
- `render/shaders/beam.js` - light beam shader strings.
- `render/shaders/mandala.js` - global/object Mandala shader strings.
- `render/shaders/vrPlane.js` - VR plane shader strings.
- `render/shaders/shape.js` - simple editor shape shader strings.
- `render/shaders/shadow.js` - object shadow shader strings.
- `render/shaders/pointGlow.js` - point glow shader strings.
- `render/shaders/screen.js` - screen/media shader strings.
- `render/shaders/greenscreen.js` - greenscreen keying shader strings.
- `render/shaders/greenscreenShadow.js` - greenscreen shadow shader strings.
- `render/shaders/imageAsset.js` - ImageAsset quad shader strings.
- `render/shaders/visualizer.js` - audio visualizer shader strings.
- `render/shaders/ipm.js` - Image Particle Module shader strings.

Planned next candidates:
- `core/utils.js`
- `modules/particles.js`
- `modules/fog.js`
- `modules/timeline.js`
- `modules/imageAssets.js`
