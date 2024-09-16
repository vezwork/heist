import {
  add,
  lerp,
  normalize,
  rotateQuarterXY,
  sub,
  mul,
  distance,
  rotateAround,
  rotate,
} from "./vec.js";
import { compile } from "./compiler.js";
import { render } from "./render.js";

// value AST data structure
class ParticleAST {
  op = "noop";
  args = [];
  constructor(op = "noop", ...args) {
    this.op = op;
    this.args = args;
  }
  toString() {
    return `${this.op}(${this.args.join(",")})`;
  }
}

const intial_scale = 0.1;

const BOX_ATOM =
  // new ParticleAST(
  //   "SCALE",
  //   0.1,
  new ParticleAST("star", ".07", "0.3");
// );

//new ParticleAST("boxAtom", "vec2(0.3, 0.3)", "vec4(0., 0., 0., 0.)")

let curScene = null;

const c = document.getElementById("c");
const ctx = c.getContext("2d");

// Handle dpr
const dpr = window.devicePixelRatio;
c.width = window.innerWidth * dpr;
c.height = window.innerHeight * dpr;
c.style.width = window.innerWidth + "px";
c.style.height = window.innerHeight + "px";
ctx.scale(dpr, dpr);

function drawLine(l) {
  if (l.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(...l[0]);
  for (const p of l) {
    ctx.lineTo(...p);
  }
  ctx.stroke();
}

function drawCircle(p, r) {
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], r, r, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawText(text, p, font = "14px monospace") {
  ctx.font = font;
  ctx.fillText(text, ...p);
}

function drawArc(a) {
  // Draw the arc
  ctx.beginPath();
  ctx.arc(
    a.center[0],
    a.center[1],
    a.radius,
    a.startAngle,
    a.endAngle,
    a.clockwise
  );
  ctx.stroke();
}

function arcFromThreePoints(p1, p2, p3) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;

  // Midpoints
  const mid1 = [(x1 + x2) / 2, (y1 + y2) / 2];
  const mid2 = [(x2 + x3) / 2, (y2 + y3) / 2];

  // Slopes of the perpendicular bisectors
  const slope1 = (x2 - x1) / (y1 - y2);
  const slope2 = (x3 - x2) / (y2 - y3);

  // Center of the circle
  const centerX =
    (mid2[1] - mid1[1] - (slope2 * mid2[0] - slope1 * mid1[0])) /
    (slope1 - slope2);
  const centerY = mid1[1] + slope1 * (centerX - mid1[0]);

  // Radius of the circle
  const radius = Math.sqrt((centerX - x1) ** 2 + (centerY - y1) ** 2);

  const startAngle = Math.atan2(p1[1] - centerY, p1[0] - centerX);
  const middleAngle = Math.atan2(p2[1] - centerY, p2[0] - centerX);
  const endAngle = Math.atan2(p3[1] - centerY, p3[0] - centerX);

  const crossProduct =
    (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
  const clockwise = crossProduct < 0;

  return {
    center: [centerX, centerY],
    radius,
    startAngle,
    middleAngle,
    endAngle,
    clockwise,
  };
}

class Handle {
  static all = [];
  constructor(x, y) {
    this.p = [x, y];
    Handle.all.push(this);
  }

  set(x, y) {
    this.p[0] = x;
    this.p[1] = y;
  }

  get x() {
    return this.p[0];
  }
  set x(n) {
    this.p[0] = n;
  }
  get y() {
    return this.p[1];
  }
  set y(n) {
    this.p[1] = n;
  }

  distanceTo(p) {
    return Math.hypot(this.x - p[0], this.y - p[1]);
  }

  getNear(pos) {
    return Handle.getNear(this.p, this);
  }

  getMyOps() {
    const ops = [];
    for (const op of Op.all) {
      if (op.start.p === this.p || op.end.p === this.p) ops.push(op);
    }
    return ops;
  }

  static getNear(pos, ignore = null) {
    for (const h of Handle.all) {
      if (h != ignore && h.distanceTo(pos) < 5) {
        return h;
      }
    }
  }

  static createOrFind(x, y) {
    let n = Handle.getNear([x, y]);
    if (n) return n;
    return new Handle(x, y);
  }
}

class Op {
  static all = [];
  particles = [];
  particleValue = (t) => lerpNum(0, 0, t);
  particlePos = (t) => lerp([this.start.p, this.end.p])(t);
  constructor(start, end) {
    this.start = start;
    this.end = end;
    Op.all.push(this);
  }

  getPrevOp() {
    return Op.all.find((op) => {
      return op.end.p === this.start.p;
    });
  }
  getNextOp() {
    return Op.all.find((op) => {
      return op.start.p === this.end.p;
    });
  }
}

class CreateOp extends Op {
  name = "NOOP";
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";

    drawLine([this.start.p, this.end.p]);

    drawCircle(this.start.p, 30);
    ctx.fill();

    ctx.fillStyle = "black";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

class ScaleOp extends Op {
  name = "SCALE";
  particleValue = (t) => lerpNum(1, this.length * 0.02, t);
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";

    drawLine([this.start.p, this.end.p]);

    this.length = distance(this.start.p, this.end.p);

    const scaleFactor = this.length * 0.2;

    const normalised = normalize(sub(this.start.p, this.end.p));
    const left = add(this.end.p, mul(scaleFactor, rotateQuarterXY(normalised)));
    const right = sub(
      this.end.p,
      mul(scaleFactor, rotateQuarterXY(normalised))
    );

    drawLine([this.start.p, left]);
    drawLine([this.start.p, right]);

    ctx.fillStyle = "black";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

class HollowOp extends Op {
  name = "HOLLOW";
  particleValue = (t) => lerpNum(0.1, this.length * 0.001, t);
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "red";
    drawLine([this.start.p, this.end.p]);
    this.length = distance(this.start.p, this.end.p);
    ctx.fillStyle = "red";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

class MeltOp extends Op {
  name = "MELT";
  particleValue = (t) => lerpNum(1.0, this.length * 0.02, t);
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "red";
    drawLine([this.start.p, this.end.p]);
    this.length = distance(this.start.p, this.end.p);
    ctx.fillStyle = "red";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

class BendOp extends Op {
  name = "BEND";
  particleValue = (t) => lerpNum(0.0, this.length * 0.02, t);
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "red";
    drawLine([this.start.p, this.end.p]);
    this.length = distance(this.start.p, this.end.p);
    ctx.fillStyle = "red";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

class DisplaceOp extends Op {
  name = "DISPLACE";
  particleValue = (t) => lerpNum(0.0, this.length * 0.02, t);
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "red";
    drawLine([this.start.p, this.end.p]);
    this.length = distance(this.start.p, this.end.p);
    ctx.fillStyle = "red";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

const lerpNum = (start, end, t) => (1 - t) * start + t * end;
const mod = (a, n, nL = 0) =>
  ((((a - nL) % (n - nL)) + (n - nL)) % (n - nL)) + nL;

class RotateOp extends Op {
  name = "ROTATE";
  particleValue = (t) => -this._particleAngle(t) + this._particleAngle(0);

  _particleAngle = (t) => {
    const { clockwise, startAngle, endAngle } = this.arc;

    if (clockwise) {
      if (startAngle > endAngle) {
        return lerpNum(startAngle, endAngle, t);
      } else {
        return lerpNum(startAngle, endAngle - Math.PI * 2, t);
      }
    } else {
      if (startAngle < endAngle) {
        return lerpNum(startAngle, endAngle, t);
      } else {
        return lerpNum(startAngle, endAngle + Math.PI * 2, t);
      }
    }
  };
  particlePos = (t) =>
    add(this.arc.center, rotate([this.arc.radius, 0], this._particleAngle(t)));

  constructor(start, end, center) {
    super(start, end);
    this.center = center;
  }

  draw() {
    this.arc = arcFromThreePoints(this.start.p, this.center.p, this.end.p);
    drawArc(this.arc);

    ctx.fillStyle = "black";

    drawCircle(this.center.p, 5);
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

class NoOp extends Op {
  name = "NOOP";
  draw() {
    drawLine([this.start.p, this.end.p]);

    ctx.fillStyle = "black";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

const UNION_OP_DROP_RADIUS = 50;

class UnionOp extends Op {
  name = "NOOP";
  constructor(start, end, insert) {
    super(start, end);
    this.insert = insert;
  }

  getInsertParticle() {
    return this.insert.getMyOps()[0]?.particles[0];
  }

  draw() {
    const mid = lerp([this.start.p, this.end.p])(0.5);
    ctx.fillStyle = "#00000011";
    drawCircle(mid, UNION_OP_DROP_RADIUS);
    ctx.fill();
    ctx.fillStyle = "black";
    drawCircle(mid, 2);

    drawLine([this.start.p, this.end.p]);

    ctx.fillStyle = "black";
    drawCircle(this.end.p, 5);
    ctx.fill();
  }
}

class Particle {
  static all = [];
  op = null; // the edge instance its on
  time = null; // between 0 and 1
  p = null;

  value = new ParticleAST();
  constructor(op, time, p = null) {
    this.op = op;
    this.time = time;
    this.value = new ParticleAST(
      this.op.name,
      this.op.particleValue(this.time),
      BOX_ATOM
    );
    this.p = p;
    op.particles.push(this);
    Particle.all.push(this);
  }

  go(t = 1) {
    const len = distance(this.op.start.p, this.op.end.p);
    const newTime = this.time + t / len;
    if (newTime > 1) {
      // go to next op
      const nextOp = this.op.getNextOp();
      if (!nextOp) {
        this.time = 1;
        this.p = this.op.particlePos(this.time);
        if (this.value.op !== "UNITE")
          this.value.args[0] = this.op.particleValue(1);
        return false;
      }
      if (this.value.op !== "UNITE")
        this.value.args[0] = this.op.particleValue(1);

      this.op.particles = this.op.particles.filter((p) => p !== this);
      this.op = nextOp;
      this.op.particles.push(this);

      this.time = newTime - 1;
      this.p = this.op.particlePos(this.time);

      this.value = new ParticleAST(
        this.op.name,
        this.op.particleValue(this.time),
        this.value
      );
    } else {
      const opLength = distance(this.op.start.p, this.op.end.p);
      const dropZoneTimeBoundary = 0.5;
      if (this.op instanceof UnionOp && this.time > dropZoneTimeBoundary) {
        const particleToUnionWith =
          this.op.insert.getMyOps()?.[0]?.particles[0];

        if (particleToUnionWith) {
          const [x, y] = sub(particleToUnionWith.p, this.p);

          this.value = new ParticleAST(
            "UNITE",
            this.value,
            new ParticleAST(
              "TRANSLATE",
              `vec2(${(x / 600).toFixed(3)}, ${-(y / 600).toFixed(3)})`,
              particleToUnionWith.value
            )
          );
          console.log("UNITE!", compile(this.value)("center"));

          particleToUnionWith.remove();
        }
      } else {
        this.value.args[0] = this.op.particleValue(this.time);
      }

      this.time = newTime;
      this.p = this.op.particlePos(this.time);
    }
  }

  remove() {
    this.op.particles = this.op.particles.filter((p) => p !== this);
    Particle.all = Particle.all.filter((p) => p !== this);
  }

  draw() {
    //console.log(this.value);
    // drawText(this.value, add(this.p, [0, 20]));

    //curScene.remove();
    curScene = render(this.value);
    //document.body.append(curScene);

    ctx.drawImage(curScene, ...add(this.p, [-600, -600]), 1200, 1200);

    // center point
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    drawCircle(this.p, 1);
    ctx.fill();
    ctx.strokeStyle = "black";
  }
}

let oa = new CreateOp(new Handle(200, 200), new Handle(200, 100));
let ob = new ScaleOp(oa.end, new Handle(300, 100));
// let oc = new NoOp(ob.end, new Handle(350, 300));
// let od = new RotateOp(oc.end, new Handle(500, 101), new Handle(500, 200));
let oe = new ScaleOp(new Handle(500, 200), new Handle(500, 120));

let of = new UnionOp(ob.end, new Handle(700, 100), oe.end);

const myFirstValue = new Particle(oa, 0);
const mySecondValue = new Particle(oe, 0);
// console.log(co.getNextOp());

let dragging = null;
let tool = null;

function applyTool(tool, p) {
  if (tool == "Create") {
    return new CreateOp(
      Handle.createOrFind(p[0], p[1]),
      new Handle(p[0], p[1])
    );
  }
  if (tool == "Scale") {
    return new ScaleOp(Handle.createOrFind(p[0], p[1]), new Handle(p[0], p[1]));
  }
  if (tool == "Hollow") {
    return new HollowOp(
      Handle.createOrFind(p[0], p[1]),
      new Handle(p[0], p[1])
    );
  }
  if (tool == "Bend") {
    return new BendOp(Handle.createOrFind(p[0], p[1]), new Handle(p[0], p[1]));
  }
  if (tool == "Melt") {
    return new MeltOp(Handle.createOrFind(p[0], p[1]), new Handle(p[0], p[1]));
  }
  if (tool == "Displace") {
    return new DisplaceOp(
      Handle.createOrFind(p[0], p[1]),
      new Handle(p[0], p[1])
    );
  }
  if (tool == "Rotate") {
    return new RotateOp(
      Handle.createOrFind(p[0], p[1]),
      new Handle(p[0] + 50, p[1] + 50),
      new Handle(p[0], p[1])
    );
  }
  if (tool == "Union") {
    return new UnionOp(
      Handle.createOrFind(p[0], p[1]),
      new Handle(p[0], p[1]),
      new Handle(p[0], p[1])
    );
  }
  if (tool == "Line") {
    return new NoOp(Handle.createOrFind(p[0], p[1]), new Handle(p[0], p[1]));
  }
  return null;
}

window.addEventListener("mousedown", (e) => {
  // find handles
  if (tool != null) {
    let p = [e.offsetX, e.offsetY];
    let op = applyTool(tool, p);
    dragging = op.end;
    tool = null;
    return;
  }

  dragging = Handle.getNear([e.clientX, e.clientY]);
});

window.addEventListener("mousemove", (e) => {
  if (dragging) {
    dragging.set(e.offsetX, e.offsetY);
  }
});

window.addEventListener("mouseup", (e) => {
  if (dragging) {
    let near = dragging.getNear();
    if (near) {
      dragging.p = near.p;
    }
    dragging = null;
  }
  tool = null;
});

const keyBindings = {
  c: "Create",
  s: "Scale",
  r: "Rotate",
  u: "Union",
  l: "Line",
  h: "Hollow",
  b: "Bend",
  m: "Melt",
  d: "Displace",
};

window.addEventListener("keydown", (e) => {
  if (keyBindings[e.key]) {
    tool = keyBindings[e.key];
    console.log(tool);
  }
});

//testing for renderer:
//document.body.append(render(compile(examples[5])("center")));

function tick() {
  ctx.clearRect(0, 0, c.width, c.height);
  Op.all.forEach((op) => op.draw());
  Particle.all.forEach((particle) => {
    particle.go();
    particle.draw();
  });

  // mySecondValue.go();
  // mySecondValue.draw();

  requestAnimationFrame(tick);

  let keys = Object.entries(keyBindings);
  let tx = 10;
  let ty = window.innerHeight - keys.length * 20;

  ctx.fillStyle = "black";
  for (const [key, op] of keys) {
    ctx.fillText(`${key}: ${op}`, tx, 10 + ty);
    ty += 20;
  }
}

tick();
