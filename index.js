const canvas = new fabric.Canvas('c');

const bezier = {
  start: [100, 100],
  first: [600, 400],
  second: [300, 0],
  end: [900, 200],
  // first: [700, 150],
  // second: [300, 250],
  // end: [200, 100],
};

const bezierPoints = {
  start: new Vector2(...bezier.start),
  first: new Vector2(...bezier.first),
  second: new Vector2(...bezier.second),
  end: new Vector2(...bezier.end)
};

const path = new fabric.Path(`M ${bezier.start.join(' ')} ` +
  `C ${bezier.first.join(' ')} ${bezier.second.join(' ')} ${bezier.end.join(' ')}`, {
  strokeWidth: 1,
  fill: '',
  stroke: 'black'
});
// canvas.add(path);

class Bezier {
  constructor(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;

    this.len = 100;
    this.arcLengths = new Array(this.len + 1);
    this.arcLengths[0] = 0;

    let ox = this.x(0);
    let oy = this.y(0);
    let clen = 0;
    const multiplier = 1 / this.len;
    for (let i = 1; i <= this.len; i += 1) {
      const x = this.x(i * multiplier), y = this.y(i * multiplier);
      const dx = Math.abs(ox - x), dy = Math.abs(oy - y);
      clen += Math.sqrt(dx ** 2 + dy ** 2);
      this.arcLengths[i] = clen;
      ox = x;
      oy = y;
    }
    this.length = clen;
  }

  map(u) {
    const targetLength = u * this.arcLengths[this.len];
    let low = 0, high = this.len, index = 0;
    while (low < high) {
      index = low + (((high - low) / 2) | 0);
      if (this.arcLengths[index] < targetLength) {
        low = index + 1;
      } else {
        high = index;
      }
    }
    if (this.arcLengths[index] > targetLength) {
      index--;
    }

    const lengthBefore = this.arcLengths[index];
    if (lengthBefore === targetLength) {
      return index / this.len;

    } else {
      return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.len;
    }
  }

  mx(t) {
    return this.x(this.map(t));
  }

  my(t) {
    return this.y(this.map(t));
  }

  pt(t, axis) {
    return (1 - t) ** 3 * this.a[axis]
      + 3 * (1 - t) ** 2 * t * this.b[axis]
      + 3 * (1 - t) * (t ** 2) * this.c[axis]
      + t ** 3 * this.d[axis];
  }

  x(t) {
    return this.pt(t, 'x');
  }

  y(t) {
    return this.pt(t, 'y');
  }

  tangent(t) {
    let mt = 1 - t,
      a = mt * mt,
      b = mt * t * 2,
      c = t * t,
      p = [
        {
          x: this.b.x - this.a.x,
          y: this.b.y - this.a.y
        },
        {
          x: this.c.x - this.b.x,
          y: this.c.y - this.b.y
        },
        {
          x: this.d.x - this.c.x,
          y: this.d.y - this.c.y
        }
      ];
    const ret = {
      x: a * p[0].x + b * p[1].x + c * p[2].x,
      y: a * p[0].y + b * p[1].y + c * p[2].y
    };
    const scale = Math.sqrt(ret.x ** 2 + ret.y ** 2);
    const normalized = {
      x: ret.x / scale,
      y: ret.y / scale,
    };

    return normalized;
  }

  normal(t) {
    const tangent = this.tangent(t);
    return {
      x: tangent.y,
      y: -tangent.x
    };
  }

  mNormal(t) {
    const nT = this.map(t);
    const tangent = this.tangent(nT);
    return {
      x: tangent.y,
      y: -tangent.x
    };
  }
}

let curve = new Bezier(
  {
    x: bezier.start[0],
    y: bezier.start[1],
  },
  {
    x: bezier.first[0],
    y: bezier.first[1],
  },
  {
    x: bezier.second[0],
    y: bezier.second[1],
  },
  {
    x: bezier.end[0],
    y: bezier.end[1],
  }
);

const svg = document.getElementById('svgElement');
flatten(svg);
const width = svg.getAttribute('width');
const height = svg.getAttribute('height');
let currentFabricSvg;
const scaleElement = document.getElementById('scale');

let isWarping = false;
function warpIfNotAlready(){
  if(!isWarping){
    warpToCurve();
  }
}
async function warpToCurve() {
  isWarping = true;
  const scaleX = +scaleElement.value || 1;
  const scaleY = +scaleElement.value || 1;
  const newWidth = width * scaleX;
  const newHeight = width * scaleY;
  const startCurve = curve;

  const count = Math.ceil(startCurve.length / newWidth);

  const svgs = [];
  for (let i = 0; i < count; i++) {
    const newSvg = svg.cloneNode(true);
    const warp = new Warp(newSvg);
    warp.interpolate(4);
    warp.transform(([x, y]) => {
      // y = y * scaleY;
      let t = ((x * scaleX) + i * newWidth) / startCurve.length;
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      const curveX = startCurve.mx(t);
      const curveY = startCurve.my(t);
      const normal = startCurve.mNormal(t);

      // TODO: The part after the addition is buggy
      const newX = curveX + (normal.x * y * scaleX);// - normal.x * newHeight / 2;
      const newY = curveY + (normal.y * y * scaleY);// - normal.y * newHeight / 2;

      return [newX, newY];
    });

    svgs.push(newSvg);
  }

  const elements = await Promise.all(svgs.map(element => {
    return new Promise(resolve => {
      const container = document.createElement('div');
      container.appendChild(element);

      fabric.loadSVGFromString(
        container.innerHTML,
        (elements) => {
          resolve(elements);
        }
      );
    })
  }));

  const group = new fabric.Group([...elements.map(element => {
    return fabric.util.groupSVGElements(element);
  })]);
  group.selectable = false;
  if (currentFabricSvg) {
    canvas.remove(currentFabricSvg);
  }
  currentFabricSvg = group;
  canvas.add(group);
  if(curve !== startCurve){
    warpToCurve();
  } else {
    isWarping = false;
  }
}

warpIfNotAlready();

function drawNormals() {
  const nbOfLines = 20;
  const length = 10;
  for (let i = 0; i < nbOfLines; i++) {
    const t = i / nbOfLines;
    const from = {
      x: curve.mx(t),
      y: curve.my(t),
    };
    const tangent = curve.mNormal(t);
    const to = {
      x: from.x + tangent.x * length,
      y: from.y + tangent.y * length
    };

    canvas.add(new fabric.Line([from.x, from.y, to.x, to.y], {
      fill: '',
      stroke: 'black',
      strokeWidth: 1
    }));
  }
}

// drawNormals();

const firstPosition = bezierPoints.start,
  lastPosition = bezierPoints.end,
  firstPoint = new LinePoint(firstPosition, new Vector2(
    bezierPoints.first.x - bezierPoints.start.x,
    bezierPoints.first.y - bezierPoints.start.y,
  )),
  lastPoint = new LinePoint(lastPosition, new Vector2(
    bezierPoints.end.x - bezierPoints.second.x,
    bezierPoints.end.y - bezierPoints.second.y,
  ));

const line = new Line(firstPoint, lastPoint);
line.points[0].secondHandle.fabricElement.visible = false;
line.points[1].firstHandle.fabricElement.visible = false;
line.paths[0].selectable = false;
canvas.add(firstPoint.fabricElement);
canvas.add(firstPoint.firstHandle.fabricElement);
canvas.add(firstPoint.secondHandle.fabricElement);
canvas.add(lastPoint.firstHandle.fabricElement);
canvas.add(lastPoint.fabricElement);
canvas.add(lastPoint.secondHandle.fabricElement);
canvas.add(line.paths[0]);


canvas.on({
  'object:moving': async (event) => {
    // Moving the line
    if (line.containsElement(event.target)) {
      line.moveElement(event.target);
    }

    if (event.target === line.paths[0]) {
      const diff = new Vector2(
        event.target.left - line.position.x,
        event.target.top - line.position.y
      );
      line.move(diff);
    }

    curve = new Bezier(
      line.start.position,
      line.start.firstHandle.position,
      line.end.secondHandle.position,
      line.end.position
    );
    warpIfNotAlready();
  }
});
