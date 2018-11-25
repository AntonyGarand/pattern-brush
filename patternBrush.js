let isWarping = false;
function warpIfNotAlready() {
  if (!isWarping) {
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
  canvas.insertAt(group, 0);
  if (curve !== startCurve) {
    warpToCurve();
  } else {
    isWarping = false;
  }
  if(normals.length){
    redrawNormals();
  }
}

warpIfNotAlready();

// let scale = 0.5;
// let direction = 0.01;
// setInterval(()=>{
//   scale += direction;
//   if(scale >= 2 || scale <= 0.5){
//     direction *= -1;
//   }
//   warpIfNotAlready();
// }, 50)
