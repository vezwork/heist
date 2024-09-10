import { add, lerp, normalize, rotateQuarterXY, sub, mul } from "./vec.js";

const c = document.getElementById("c");
const ctx = c.getContext("2d");

class Handle {
  static all = [];
  constructor(x, y) {
    this.x = x;
    this.y = y;
    Handle.all.push(this);
  }
}

class Op {
  static all = [];
  constructor(start, end) {
    this.start = start;
    this.end = end;
    Op.all.push(this);
  }

  getNextOp() {
    return Op.all.find((op) => {
      return op.start === this.end;
    });
  }
}

class CreateOp extends Op {
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";

    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(this.start.x, this.start.y, 30, 30, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.ellipse(this.end.x, this.end.y, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

class ScaleOp extends Op {
  draw() {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";

    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();

    this.length = Math.hypot(
      this.start.x - this.end.x,
      this.start.y - this.end.y,
    );

    const scaleFactor = this.length * 0.2;

    const start = [this.start.x, this.start.y];
    const end = [this.end.x, this.end.y];
    const normalised = normalize(sub(start, end));
    const left = add(end, mul(scaleFactor, rotateQuarterXY(normalised)));
    const right = sub(end, mul(scaleFactor, rotateQuarterXY(normalised)));

    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(left[0], left[1]);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(right[0], right[1]);
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.ellipse(this.end.x, this.end.y, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

let co = new CreateOp(new Handle(200, 200), new Handle(200, 100));
let so = new ScaleOp(co.end, new Handle(300, 100));
console.log(co.getNextOp());

let dragging = null;
window.addEventListener("mousedown", (e) => {
  // find handles
  for (const h of Handle.all) {
    if (Math.hypot(h.x - e.offsetX, h.y - e.offsetY) < 30) {
      dragging = h;
      break;
    }
  }
});

window.addEventListener("mousemove", (e) => {
  if (dragging) {
    dragging.x = e.offsetX;
    dragging.y = e.offsetY;
  }
});

window.addEventListener("mouseup", (e) => {
  if (dragging) {
    dragging = null;
  }
});

function tick() {
  ctx.clearRect(0, 0, c.width, c.height);
  Op.all.forEach((op) => op.draw());
  requestAnimationFrame(tick);
}

tick();
