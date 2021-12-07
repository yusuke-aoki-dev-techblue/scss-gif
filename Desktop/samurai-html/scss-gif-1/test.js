'use strict';

var size = 400 / 7;                   // one cell in the grid
var maxSize = 52;                     // max size of a square in a cell
var vcircleRadius = 135*Math.sqrt(2); // size of the virtual circle used to determine line of wave
var lineDistance = 150;               // the range of distance to use for determining size (wave width)
var minDistFactor = 0.40;             // lower cap for distance factor

var colours = [
  '#612e8d',
  '#1674bc',
  '#00a396',
  '#81c540',
  '#f5b52e',
  '#ed5b35',
  '#ea225e',
  '#c22286',
  '#612e8d',
  '#1674bc',
  '#00a396',
  '#81c540',
  '#f5b52e'
];

function getWrapped(array, startIndex, numElements) {
  startIndex = (startIndex % array.length);
  var result = [];
  for(var i = startIndex; i < startIndex + numElements; i += 1) {
    result.push(array[i % array.length]);
  }
  
  return result;
}

class Easing {
  static easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }

  static easeInOutCirc(x) {
    return x < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
  }
}

// https://gist.github.com/mattdesl/47412d930dcd8cd765c871a65532ffac
class LineHelpers {
  static dist(point, x, y) {
    let dx = x - point.x;
    let dy = y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }  
  
  // point - { x, y } (Point)
  // line - { sx, sy, ex, ey }
  static distToSegment(point, line) {
    let dx = line.ex - line.sx;
    let dy = line.ey - line.sy;
    let l2 = dx * dx + dy * dy;

    if (l2 == 0)
      return this.dist(point, line.sx, line.sy);

    let t = ((point.x - line.sx) * dx + (point.y - line.sy) * dy) / l2;
    t = Math.max(0, Math.min(1, t));

    return this.dist(point, line.sx + t * dx, line.sy + t * dy);
  }
}

class ColourBox {
  constructor(x, y, colour) {
    this.x = x;
    this.y = y;
    this.c = colour;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Line {
  constructor(sx, sy, ex, ey) {
    this.sx = sx;
    this.sy = sy;
    this.ex = ex;
    this.ey = ey;
  }
}

class VirtualCircle {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.r = radius;
    this.s = 1.58;
    
    this.a1 = 180;
    this.a2 = 0;
    this.p1 = new Point(0, 0);
    this.p2 = new Point(0, 0);
    this.l = new Line(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
  }
  
  static deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
  
  static pointOnCircle(x, y, r, a) {
    return new Point(
      x + Math.cos(a) * r,
      y + Math.sin(a) * r
    );
  }
  
  step() {
    this.a1 = (this.a1 + this.s) % 360;
    this.a2 = (this.a2 + this.s) % 360;
    this.p1 = VirtualCircle.pointOnCircle(this.x, this.y, this.r, VirtualCircle.deg2rad(this.a1));
    this.p2 = VirtualCircle.pointOnCircle(this.x, this.y, this.r, VirtualCircle.deg2rad(this.a2));
    this.l  = new Line(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
  }
  
  crossLine() {
    return this.l;
  }
}

class ColourGrid {
  constructor(width, height, circle) {
    this.w = width;
    this.h = height;
    this.g = [];
    this.c = circle;
    
    for(var y = 0; y < height; y += 1) {
      let c = getWrapped(colours, y, 7);
      for(var x = 0; x < width; x += 1) 
        this.g.push(new ColourBox(x, y, c[x]));
    }
  }
  
  // https://codepen.io/simon-wu/pen/ExgLEXQ
  static roundedRect(context, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }
  
  render(context) {
    context.fillStyle = 'rgba(38, 38, 38, 1)';
    context.fillRect(0, 0, 400, 400);
    
    for (let i = 0; i < this.g.length; ++i) {
      let box = this.g[i],
          cx = (box.x * size) + (size / 2),
          cy = (box.y * size) + (size / 2),
          dist = LineHelpers.distToSegment(
            new Point(cx, cy),
            this.c.crossLine());
      
      let distd = Math.max((lineDistance - Math.min(dist, lineDistance)) / lineDistance, minDistFactor);
      distd = Easing.easeInOutQuad(distd);
      let bsize = Math.min(size * distd, maxSize);
      let x = cx - (bsize / 2);
      let y = cy - (bsize / 2);
      
      ColourGrid.roundedRect(context, x, y, bsize, bsize, 5 * distd);
      context.fillStyle = box.c;
      context.fill();
    }
  }
}

window.addEventListener('load', function() {
  let canvas  = document.getElementById("animation"),
      context = canvas.getContext("2d"),
      circle = new VirtualCircle(200, 200, vcircleRadius),
      grid = new ColourGrid(7, 7, circle);
  
  +(function animation() {
    requestAnimationFrame(animation);
    
    circle.step();
    grid.render(context);
    
    /* debug line
    context.beginPath();
    context.moveTo(circle.p1.x, circle.p1.y);
    context.lineTo(circle.p2.x, circle.p2.y);
    context.strokeStyle = '#ffffff';
    context.stroke();
    context.closePath();
    */
  }());
});