const canvas = new fabric.Canvas('c');
let scale = 0;
const bezier = {
  start: [100, 100],
  first: [600, 400],
  second: [300, 0],
  end: [900, 200],
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

let svg = document.getElementById('svgElement');
flatten(svg);

const scaleElement = document.getElementById('scale');

let isWarping = false;
function warpIfNotAlready(){
  if(!isWarping){
    warpToCurve();
  }
}

let currentFabricSvg;
async function warpToCurve() {
  isWarping = true;
  const {width, height, svg} = await selectedSVG;
  const scaleX = scale || +scaleElement.value || 1;
  const scaleY = scale || +scaleElement.value || 1;
  const newWidth = width * scaleX;
  const newHeight = height * scaleY;
  const startCurve = curve;

  const count = Math.ceil(startCurve.length / newWidth);

  const svgs = [];
  for (let i = 0; i < count; i++) {
    const newSvg = svg.cloneNode(true);
    const warp = new Warp(newSvg);
    warp.interpolate(4);
    warp.transform(([x, y]) => {
      // Flipping it around for it to be on the correct side, thanks to fabric.js
      // Subtracting height / 2 to center it, instead of making it on / on top of the item
      y = height / 2 - y;

      let t = ((x * scaleX) + i * newWidth) / startCurve.length;
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      const curveX = startCurve.mx(t);
      const curveY = startCurve.my(t);
      const normal = startCurve.mNormal(t);

      const offsetX = (normal.x * y * scaleX);
      const offsetY = (normal.y * y * scaleY);

      const newX = curveX + offsetX;
      const newY = curveY + offsetY;

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
  canvas.insertAt(group,0);
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

// let scale = 0.5;
// let direction = 0.01;
// setInterval(()=>{
//   scale += direction;
//   if(scale >= 2 || scale <= 0.5){
//     direction *= -1;
//   }
//   warpIfNotAlready();
// }, 50)
