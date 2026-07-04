// Final camera pass: keeps the canvas fixed and transforms only the rendered scene.
const VSE_SCENE_VIEW_VERTEX_SHADER = "attribute vec2 aPos;varying vec2 vUv;void main(){vUv=aPos*.5+.5;gl_Position=vec4(aPos,0.0,1.0);}";
const VSE_SCENE_VIEW_FRAGMENT_SHADER = "precision mediump float;uniform sampler2D uScene;uniform float uZoom;uniform vec2 uPan;varying vec2 vUv;void main(){vec2 uv=(vUv-.5-uPan)/uZoom+.5;if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)gl_FragColor=vec4(.02,.024,.028,1.0);else gl_FragColor=texture2D(uScene,uv);}";
