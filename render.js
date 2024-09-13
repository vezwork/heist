import { shader } from "./shader.js";
import { atoms } from "./atoms.js";
import { compile } from "./compiler.js";

const background_color = `vec4(0.5, 0.5, 0.5, 0.0)`;
const interior_color = `vec4(0.5, 0.5, 0.5, 1.0)`;
const border_color = `vec4(0.0, 0.0, 0.0, 0.0)`;

const myShader = shader({ height: 1200, width: 1200, iMouse: true });

export const render = (scene) => {
  // console.log("SCENE");
  // console.log(compile(scene)("center"));
  // console.log("END SCENE");
  return myShader`
  ${atoms}
  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // coords  
    vec2 center = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    // scene
    float d = ${compile(scene)("center")};
    // colors
    vec4 background = ${background_color};
    vec4 interior = ${interior_color};
    vec4 border = ${border_color};
    // render
    float borderWidth = 0.01;
    float aaWidth = 2.0 / iResolution.y; // Anti-aliasing width based on pixel size
    
    // Smooth border transition
    float borderMix = smoothstep(-borderWidth - aaWidth, -borderWidth + aaWidth, d);
    
    // Smooth edge transition
    float edgeMix = smoothstep(-aaWidth, aaWidth, d);
    
    // Combine colors
    vec4 color = mix(interior, border, borderMix);
    color = mix(color, background, edgeMix);
    
    fragColor = color; // output
  }
  `;
};
