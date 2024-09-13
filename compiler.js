const rotMatrix = (angle) =>
  `inverse(mat2(cos(${angle}), sin(${angle}), -sin(${angle}),cos(${angle})))`;

function startsWithLowerCase(str) {
  if (str.length === 0) return false;
  return str[0] === str[0].toLowerCase() && str[0] !== str[0].toUpperCase();
}

export const compile = (node) => {
  // if (typeof node === "number") {
  //   return node.toFixed(3);
  // }

  if (typeof node !== "object" || node === null) {
    console.log("fallthrough atom case: " + node);
    return node;
  }

  const { op, args } = node;

  //NOTE: treat all lowercase things as atoms
  if (startsWithLowerCase(op)) {
    if (args.length === 0) return (x) => `${op}(${x})`;
    else return (x) => `${op}(${x}, ${args})`;
  }

  if (op === "NOOP") {
    return compile(args[1]);
  }

  if (op === "TRANSLATE") {
    const [disp, innerNode] = args;
    const innerExpanded = compile(innerNode);
    return (x) => `(${innerExpanded(`${x}-${disp}`)})`;
  }

  if (op === "ROTATE") {
    const [angle, innerNode] = args;
    const innerExpanded = compile(innerNode);
    const anglef = Number(angle).toFixed(3);
    return (x) => innerExpanded(`(${rotMatrix(anglef)} * ${x})`);
  }

  if (op === "SCALE") {
    const [scale, innerNode] = args;
    const innerExpanded = compile(innerNode);
    const scalef = Number(scale).toFixed(3);
    return (x) => `(${scalef} * ${innerExpanded(`(${x}/${scalef})`)})`;
  }

  if (op === "HOLLOW") {
    const [radius, innerNode] = args;
    const innerExpanded = compile(innerNode);
    const radiusf = Number(radius).toFixed(3);
    return (x) => `(abs(${innerExpanded(`(${x})`)}) - ${radiusf})`;
  }

  if (op === "MELT") {
    const [radius, innerNode] = args;
    const innerExpanded = compile(innerNode);
    const radiusf = Number(radius).toFixed(3);
    return (x) => `(${innerExpanded(`(${x})`)} - ${radiusf})`;
  }

  if (op === "BEND") {
    const [k, innerNode] = args;
    const innerExpanded = compile(innerNode);
    const kf = Number(k).toFixed(3);
    return (x) =>
      `(${innerExpanded(
        `(mat2(cos(${kf}*${x}.x),-sin(${kf}*${x}.x),sin(${kf}*${x}.x),cos(${kf}*${x}.x))*${x})`
      )})`;
  }

  if (op === "DISPLACE") {
    const [k, innerNode] = args;
    const innerExpanded = compile(innerNode);
    const kf = Number(k).toFixed(3);
    return (x) =>
      `(${innerExpanded(`(${x})`)}) + sin(${kf}*${x}.x)*sin(${kf}*${x}.y)`;
  }

  if (op === "UNITE") {
    const a = compile(args[0]);
    const b = compile(args[1]);
    return (x) => `min(${a(x)}, ${b(x)})`;
  }

  if (op === "SUBTRACT") {
    const a = compile(args[0]);
    const b = compile(args[1]);
    return (x) => `max(-${a(x)}, ${b(x)})`;
  }

  if (op === "INTERSECT") {
    const a = compile(args[0]);
    const b = compile(args[1]);
    return (x) => `max(${a(x)}, ${b(x)})`;
  }

  if (op === "SMUNITE") {
    const a = compile(args[0]);
    const b = compile(args[1]);
    const k = compile(args[2]);
    return (x) =>
      `min(${a(x)}, ${b(x)}) - max(${k(x)}-abs(${a(x)}-${b(x)}),0.0) * max(${k(
        x
      )}-abs(${a(x)}-${b(x)}),0.0)*0.25/${k(x)}`;
  }

  if (op === "SMUTRACT") {
    const a = compile(args[0]);
    const b = compile(args[1]);
    const k = compile(args[2]);
    return (x) =>
      `-min(${a(x)}, -${b(x)}) - max(${k(x)}-abs(${a(x)}+${b(
        x
      )}),0.0) * max(${k(x)}-abs(${a(x)}+${b(x)}),0.0)*0.25/${k(x)}`;
  }

  if (op === "SMUSECT") {
    const a = compile(args[0]);
    const b = compile(args[1]);
    const k = compile(args[2]);
    return (x) =>
      `-min(-${a(x)}, -${b(x)}) - max(${k(x)}-abs(-${a(x)}+${b(
        x
      )}),0.0) * max(${k(x)}-abs(-${a(x)}+${b(x)}),0.0)*0.25/${k(x)}`;
  }

  // Other operations here
  console.log("compile fallthrough");

  return {
    op,
    args: args.map(compile),
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

// """TESTS""""
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
  console.log(compile(example)("center"));
  console.log();
});
