// VSE vrPlaneProg shader module. Classic script loaded before the main app script.
const VSE_VR_PLANE_VERTEX_SHADER = "\nattribute vec3 aPos;\nattribute vec2 aUv;\nuniform mat4 uMvp;\nvarying vec2 vUv;\nvoid main(){\n  vUv=aUv;\n  gl_Position=uMvp*vec4(aPos,1.0);\n}";
const VSE_VR_PLANE_FRAGMENT_SHADER = "precision mediump float;\nuniform sampler2D uTex;\nvarying vec2 vUv;\nvoid main(){\n  gl_FragColor=texture2D(uTex,vUv);\n}";
