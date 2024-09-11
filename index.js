import { add, lerp } from "./vec.js";
import { render } from "./render.js"

let sample_scene = {
  op: "unite",
  args: [
    {
      op: "SCALE",
      args: [
        "0.8",
        {
          op: "boxAtom",
          args: ["center", "vec2(0.9, 0.6)", "vec4(0.5, 0.3, 0.1, 0.2)"],
        },
      ],
    },
    {
      op: "ROTATE",
      args: [
        "20.0",
        {
          op: "plainBox",
          args: ["center", "vec2(0.9, 0.1)"],
        },
      ],
    },
  ],
};

document.body.append(render(sample_scene));

const c = document.getElementById("c");
const ctx = c.getContext("2d");

const line = [];

let mousedown = false;
c.addEventListener("mousedown", (e) => {
  mousedown = true;
});
c.addEventListener("mousemove", (e) => {
  if (mousedown) line.push([e.offsetX, e.offsetY]);
});
c.addEventListener("mouseup", (e) => {
  mousedown = false;
});

export function drawLine(l) {
  if (l.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(...l[0]);
  for (const p of l) {
    ctx.lineTo(...p);
  }
  ctx.stroke();
}

ctx.font = "16px monospace";
ctx.textBaseline = "top";

const TEXT_OFFSET = [20, 0];

const l1 = [
  [250, 50],
  [150, 150],
];

const l2 = [
  [150, 150],
  [300, 140],
];

const vHistory = [];

let t = 0;
function loop() {
  requestAnimationFrame(loop);
  ctx.clearRect(0, 0, c.width, c.height);
  drawLine(l1);
  ctx.fillStyle = "black";
  ctx.fillText("*2", ...lerp(l1)(0.5));
  drawLine(l2);
  ctx.fillStyle = "black";
  ctx.fillText("sqrt", ...lerp(l2)(0.5));

  const p = t < 1 ? lerp(l1)(t) : lerp(l2)(t - 1);

  if (t < 1) {
    ctx.fillStyle = "red";
    ctx.fillRect(...p, 10, 10);

    const initV = 3;
    const v = initV * (1 + t);
    ctx.fillText(v.toFixed(2), ...add(p, TEXT_OFFSET));

    vHistory.push([t * 10, v * 5]);
  } else if (t >= 1) {
    const rt = t - 1;
    ctx.fillStyle = "red";
    ctx.fillRect(...p, 10, 10);

    const initV = 3 * 2;
    const v = initV ** (1 / (1 + rt));
    ctx.fillText(v.toFixed(2), ...add(p, TEXT_OFFSET));

    vHistory.push([t * 10, v * 5]);
  }

  ctx.fillStyle = "red";
  for (const vhp of vHistory) {
    ctx.fillRect(...add([70, -vHistory[0][1]], add(p, vhp)), 1, 1);
  }

  //aside: drawing
  drawLine(line);

  t = Math.min(2, t + 0.002);
}
//loop();
