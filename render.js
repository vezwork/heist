import { shader } from "./shader.js";

const atoms = `
float sdCornerCircle(in vec2 p) {
  return length(p - vec2(0.0, -1.0)) - sqrt(2.0);
}

float boxAtom(in vec2 p, in vec2 b, in vec4 r) {
  // select corner radius
  r.xy = (p.x > 0.0) ? r.xy : r.zw;
  r.x  = (p.y > 0.0) ? r.x  : r.y;
  // box coordinates
  vec2 q = abs(p) - b + r.x;
  // distance to sides
  if(min(q.x, q.y) < 0.0) return max(q.x, q.y) - r.x;
  // rotate 45 degrees, offset by r and scale by r*sqrt(0.5) to canonical corner coordinates
  vec2 uv = vec2(abs(q.x - q.y), q.x + q.y - r.x )/r.x;
  // compute distance to corner shape
  float d = sdCornerCircle(uv);
  // undo scale
  return d * r.x * sqrt(0.5);
}

float plainBox(in vec2 p, in vec2 b) {
  return boxAtom(p, b, vec4(0.01, 0.01, 0.01, 0.01));
}
`;

const binops = `
float unite( float d1, float d2 ) {
  return min(d1, d2);
}

float subtraction( float d1, float d2 ) {
  return max(-d1, d2);
}

float intersection( float d1, float d2 ) {
  return max(d1, d2);
}

float smoothUnion( float d1, float d2, float k ) {
  float h = max(k-abs(d1-d2),0.0);
  return min(d1, d2) - h*h*0.25/k;
}

float smoothSubtraction( float d1, float d2, float k ) {
  return -smoothUnion(d1, -d2, k);
}

float smoothIntersection( float d1, float d2, float k ) {
  return -smoothUnion(-d1, -d2, k);
}
`;

const rotMatrix = (angle) =>
  `inverse(mat2(cos(${angle}), sin(${angle}), -sin(${angle}),cos(${angle})))`;

export const expandMacros = (node) => {
  // for handling leaves
  if (typeof node === "number") {
    return node.toFixed(3);
  }

  if (typeof node !== "object" || node === null) {
    console.log("fallthrough case: " + node);
    return node;
  }

  const { op, args } = node;

  console.log("processing OP: " + op);

  if (op === "boxAtom") {
    return (x) => `boxAtom(${x}, ${args})`;
  }

  if (op === "NOOP") {
    return expandMacros(args[1]);
  }

  if (op === "ROTATE") {
    const [angle, innerNode] = args;
    const innerExpanded = expandMacros(innerNode);
    const anglef = Number(angle).toFixed(3);
    return (x) => innerExpanded(`(${rotMatrix(anglef)} * ${x})`);
  }

  if (op === "SCALE") {
    const [scale, innerNode] = args;
    const innerExpanded = expandMacros(innerNode);
    const scalef = Number(scale).toFixed(3);
    return (x) => `(${scalef} * ${innerExpanded(`(${x}/${scalef})`)})`;
  }

  if (op === "UNITE") {
    const [innerNode1, innerNode2] = args;
    const innerExpanded1 = expandMacros(innerNode1);
    const innerExpanded2 = expandMacros(innerNode2);
    return (x) => `min(${innerExpanded1(x)}, ${innerExpanded2(x)})`;
  }

  // Other operations here

  return {
    op,
    args: args.map(expandMacros),
  };
};

const toGLSL = (node) => {
  if (typeof node === "string") {
    return node;
  }

  if (typeof node === "number") {
    return node.toFixed(2);
  }

  if (typeof node !== "object" || node === null) {
    return String(node);
  }

  const { op, args } = node;

  // List of operators to be treated as infix
  const infixOps = [
    "+",
    "-",
    "*",
    "/",
    "/",
    "==",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "&&",
    "||",
  ];

  if (infixOps.includes(op)) {
    if (args.length !== 2) {
      throw new Error(`Infix operator ${op} must have exactly 2 arguments`);
    }
    return `(${toGLSL(args[0])} ${op} ${toGLSL(args[1])})`;
  }

  // Special case for vector constructors
  if (
    op.startsWith("vec") ||
    op.startsWith("ivec") ||
    op.startsWith("uvec") ||
    op.startsWith("bvec")
  ) {
    return `${op}(${args.map(toGLSL).join(", ")})`;
  }

  // Function application
  return `${op}(${args.map(toGLSL).join(", ")})`;
};

const _scene_test = `
  unite(
    scaledBox(center, vec2(0.9, 0.6), vec4(0.5, 0.3, 0.1, 0.2), 0.8),
    rotatedBox(center, vec2(1.1, 0.4), vec4(0.1, 0.1, 0.1, 0.1), 20.0))
  `;

const background_color = `vec4(0.5, 0.5, 0.5, 0.0)`;
const interior_color = `vec4(0.5, 0.5, 0.5, 1.0)`;
const border_color = `vec4(0.0, 0.0, 0.0, 0.0)`;

export const render = (scene) => {
  console.log("SCENE:");
  console.log(expandMacros(scene)("center"));
  console.log("END SCENE");
  return shader({ height: 200, iMouse: true })`
  ${binops}
  ${atoms}
  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // coords  
    vec2 center = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    // scene
    float d = ${expandMacros(scene)("center")};
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

// // Test the function
// console.log("YOOOOO:")
// console.log("SCALE example:");
// console.log(JSON.stringify(expandMacros(v1_in), null, 2));

// console.log("\nROTATE example:");
// console.log(JSON.stringify(expandMacros(v2_in), null, 2));

// console.log("\wWHOLE example:");
// console.log(JSON.stringify(expandMacros(input), null, 2));

// Test the function with examples
export const examples = [
  {
    op: "boxAtom",
    args: ["vec2(0.8, 0.9)"],
  },
  {
    op: "NOOP",
    args: [
      "666",
      {
        op: "boxAtom",
        args: ["vec2(0.8, 0.9)"],
      },
    ],
  },
  {
    op: "ROTATE",
    args: [
      "20.0",
      {
        op: "boxAtom",
        args: ["vec2(0.8, 0.9)"],
      },
    ],
  },
  {
    op: "SCALE",
    args: [
      "0.5",
      {
        op: "boxAtom",
        args: ["vec2(0.8, 0.9)"],
      },
    ],
  },
  {
    op: "SCALE",
    args: [
      "0.5",
      {
        op: "ROTATE",
        args: [
          "20.0",
          {
            op: "boxAtom",
            args: ["vec2(0.8, 0.9)"],
          },
        ],
      },
    ],
  },
  {
    op: "ROTATE",
    args: [
      "20.0",
      {
        op: "NOOP",
        args: [
          "666",
          {
            op: "UNITE",
            args: [
              {
                op: "boxAtom",
                args: ["vec2(0.2, 2.0)"],
              },
              {
                op: "boxAtom",
                args: ["vec2(0.8, 0.9)"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    op: "UNITE",
    args: [
      {
        op: "ROTATE",
        args: [
          "20.0",
          {
            op: "boxAtom",
            args: ["vec2(0.8, 0.9)"],
          },
        ],
      },
      {
        op: "SCALE",
        args: [
          "0.5",
          {
            op: "boxAtom",
            args: ["vec2(0.2, 2.0)"],
          },
        ],
      },
    ],
  },
];

examples.forEach((example, index) => {
  console.log(`Example ${index + 1}:`);
  console.log(expandMacros(example)("center"));
  console.log();
});

// const rotated = (f) => `
// float rotatedBox(in vec2 p, in vec2 b, in vec4 r, in float angle) {
//   mat2 transform = mat2(
//      cos(angle), sin(angle),
//     -sin(angle),cos(angle));
//   return ${f}(inverse(transform)*p,b,r);
// }
// `;

// const scaled = (f) => `
// float scaledBox(in vec2 p, in vec2 b, in vec4 r, in float scale) {
//   return ${f}(p/scale, b, r)*scale;
// }
// `;

// const more_init = [
//   "unite",
//   ["scale", 0.8, ["rect", 0.9, 0.6]],
//   ,
//   ["rotate", 20.0, ["rect", 1.1, 0.4]],
// ];

// const scene_init = `
//   unite(
//     scale(0.8, boxAtom(center, vec2(0.9, 0.6), vec4(0.5, 0.3, 0.1, 0.2)),
//     rotate(20.0, boxAtom(center, vec2(1.1, 0.4), vec4(0.1, 0.1, 0.1, 0.1)))
//   `;

// const scene2 = `
//   unite(
//     boxAtom(center/0.8, vec2(0.9, 0.6), vec4(0.5, 0.3, 0.1, 0.2))*0.8,
//     boxAtom(${rotMatrix(
//       `20.0`
//     )}*center, vec2(1.1, 0.4), vec4(0.1, 0.1, 0.1, 0.1)))
//   `;

/*
unite((0.8 * boxAtom((center / 0.8), vec2(0.9, 0.6), vec4(0.5, 0.3, 0.1, 0.2))), boxAtom((inverse(mat2(cos(20.0), sin(20.0), -sin(20.0),cos(20.0))) * center), vec2(0.9, 0.6), vec4(0.5, 0.3, 0.1, 0.2)))

  */

// let v1_in = {
//   op: "SCALE",
//   args: [
//     "0.8",
//     {
//       op: "boxAtom",
//       args: ["center", "vec2(0.9, 0.6)", "vec4(0.5, 0.3, 0.1, 0.2)"],
//     },
//   ],
// };
// let v1_out = {
//   op: "*",
//   args: [
//     "0.8",
//     {
//       op: "boxAtom",
//       args: [
//         { op: "/", args: ["center", "0.8"] },
//         "vec2(0.9, 0.6)",
//         "vec4(0.5, 0.3, 0.1, 0.2)",
//       ],
//     },
//   ],
// };
// const v2_in = {
//   op: "ROTATE",
//   args: [
//     "20.0",
//     {
//       op: "boxAtom",
//       args: ["center", "vec2(0.9, 0.6)", "vec4(0.5, 0.3, 0.1, 0.2)"],
//     },
//   ],
// };
