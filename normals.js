let normals = [];

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

    const line = new fabric.Line([from.x, from.y, to.x, to.y], {
      fill: '',
      stroke: 'red',
      strokeWidth: 1
    });
    canvas.add(line);
    normals.push(line);
  }
}

function toggleNormals() {
  if (normals.length) {
    removeNormals();
    normals.length = 0;
  } else {
    drawNormals();
  }
}

function removeNormals() {
  normals.forEach(line => {
    canvas.remove(line);
  });
}

function redrawNormals() {
  removeNormals();
  drawNormals();
}

