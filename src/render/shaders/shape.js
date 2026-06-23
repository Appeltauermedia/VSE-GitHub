// VSE shapeProg shader module. Classic script loaded before the main app script.
const VSE_SHAPE_VERTEX_SHADER = "\nattribute vec2 a; uniform vec2 uRes; uniform vec2 uPos; uniform float uScale; uniform float uRot;\nvoid main(){float c=cos(uRot),s=sin(uRot);vec2 p=vec2(a.x*c-a.y*s,a.x*s+a.y*c)*uScale+uPos;vec2 z=p/uRes*2.0-1.0;gl_Position=vec4(z.x,-z.y,0,1);}";
const VSE_SHAPE_FRAGMENT_SHADER = "precision mediump float; uniform vec4 uColor; void main(){gl_FragColor=uColor;}";
