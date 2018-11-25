// Creating the fabric.js canvas, creating the curve

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
