const pointConfig = {
  strokeWidth: 4,
  radius: 8,
  fill: '#fff',
  stroke: '#333'
};

const handleConfig = {
  strokeWidth: 2,
  radius: 4,
  fill: '#fff',
  stroke: '#666'
};

const lineConfig = {
  fill: '',
  stroke: 'black',
  objectCaching: false
};

fabric.Circle.prototype.originX = fabric.Circle.prototype.originY = 'center';

class Line {
  constructor(startPoint, endPoint) {
    this.position = new Vector2(startPoint.position.x, startPoint.position.y);
    this.start = startPoint;
    this.end = endPoint;
    this.points = [startPoint, endPoint];
    this.paths = [];
    this.paths.push(this.createLine(this.start, this.end));
  }

  createLine(startPoint, endPoint) {
    const line = new fabric.Path(
      `M ${startPoint.position.x} ${startPoint.position.y} ` +
      `C ${startPoint.firstHandle.position.x}, ${startPoint.firstHandle.position.y}, ` +
      `${endPoint.secondHandle.position.x}, ${endPoint.secondHandle.position.y}, ` +
      `${endPoint.position.x}, ${endPoint.position.y}`,
      {...lineConfig}
    );
    line.hasBorders = false;
    line.hasControls = false;
    line.selectable = false;

    return line;
  }

  move(diff) {
    this.position = this.position.add(diff);
    this.start.move(diff);
    this.end.move(diff);
  }

  // Returns true if the given fabric element is used in the line
  // Ex: Point, line or handle
  containsElement(element) {
    return [
      ...this.points.reduce((acc, p) => {
        acc.push(p.fabricElement);
        acc.push(p.firstHandle.fabricElement);
        acc.push(p.secondHandle.fabricElement);
        return acc;
      }, []),
      ...this.paths
    ].includes(element);
  }

  moveElement(element) {
    // Check if it's a point
    let matchingPoint = this.points.find(p => p.fabricElement === element);
    if (matchingPoint) {
      this.movePoint(matchingPoint);
    }

    // Else, it's a handle, find its point and perform the appropriate stuff
    matchingPoint = this.points.find(p => p.firstHandle.fabricElement === element || p.secondHandle.fabricElement === element);
    if (matchingPoint) {
      const handle = matchingPoint.firstHandle.fabricElement === element ? matchingPoint.firstHandle : matchingPoint.secondHandle;
      this.moveHandle(matchingPoint, handle);
    }
  }

  movePoint(point) {
    const offset = new Vector2(
      point.fabricElement.left - point.position.x,
      point.fabricElement.top - point.position.y
    );
    point.position = point.position.add(offset);
    point.firstHandle.move(offset);
    point.secondHandle.move(offset);
    const pointIndex = this.points.indexOf(point);

    const pathWherePointIsStart = this.paths[pointIndex];
    const pathWherePointIsEnd = this.paths[pointIndex - 1];
    if (pathWherePointIsStart) {
      const startPosition = pathWherePointIsStart.path[0];
      startPosition[1] = point.position.x;
      startPosition[2] = point.position.y;
      const path = pathWherePointIsStart.path[1];
      path[1] = point.firstHandle.position.x;
      path[2] = point.firstHandle.position.y;
    }
    if (pathWherePointIsEnd) {
      const path = pathWherePointIsEnd.path[1];
      path[3] = point.secondHandle.position.x;
      path[4] = point.secondHandle.position.y;

      path[5] = point.position.x;
      path[6] = point.position.y;
    }
  }

  moveHandle(point, handle) {
    console.debug('Move handle');
    const isFirstHandle = handle === point.firstHandle;
    // Update handle position vector
    const offset = new Vector2(
      handle.fabricElement.left - handle.position.x,
      handle.fabricElement.top - handle.position.y
    );
    handle.position = handle.position.add(offset);
    // Move the opposite handle, as they need to match their strength
    if (isFirstHandle) {
      point.secondHandle.move(offset.flip());
    } else {
      point.firstHandle.move(offset.flip());
    }

    const pointIndex = this.points.indexOf(point);

    const pathWherePointIsStart = this.paths[pointIndex];
    const pathWherePointIsEnd = this.paths[pointIndex - 1];
    if (pathWherePointIsStart) {
      const path = pathWherePointIsStart.path[1];
      path[1] = point.firstHandle.position.x;
      path[2] = point.firstHandle.position.y;
    }
    if (pathWherePointIsEnd) {
      const path = pathWherePointIsEnd.path[1];
      path[3] = point.secondHandle.position.x;
      path[4] = point.secondHandle.position.y;
    }
  }

  addSegment(segmentPosition, canvas) {
    const newPoint = new LinePoint(segmentPosition, new Vector2(50, 50));
    const previousEnd = this.end;
    this.end = newPoint;
    this.points.push(newPoint);

    // The new segment is the new end, so make the previous handle visible
    previousEnd.firstHandle.fabricElement.visible = true;
    newPoint.firstHandle.fabricElement.visible = false;

    // Create the new path segment
    const newPath = this.createLine(previousEnd, newPoint);
    this.paths.push(newPath);

    // Add those things to the canvas
    canvas.add(newPoint.fabricElement);
    canvas.add(newPoint.firstHandle.fabricElement);
    canvas.add(newPoint.secondHandle.fabricElement);
    canvas.add(newPath);
  }

}

class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  substract(other) {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  flip() {
    return new Vector2(-this.x, -this.y);
  }
}

class LinePoint {
  constructor(position, handleVector) {
    this.position = position;
    this.handleVector = handleVector;
    this.fabricElement = this.createElement();
    this.firstHandle = new Handle(position.add(handleVector));
    this.secondHandle = new Handle(position.add(handleVector.flip()));
  }

  createElement() {
    const element = new fabric.Circle({...pointConfig, top: this.position.y, left: this.position.x});
    element.hasBorders = false;
    element.hasControls = false;
    return element;
  }

  move(offset) {
    this.position = this.position.add(offset);
    this.fabricElement.top = this.position.y;
    this.fabricElement.left = this.position.x;
    this.fabricElement.setCoords();
    this.firstHandle.move(offset);
    this.secondHandle.move(offset);
  }
}

class Handle {
  constructor(position) {
    this.position = position;
    this.fabricElement = new fabric.Circle({...handleConfig, top: position.y, left: position.x});
    // this.fabricElement.hasBorders = false;
    this.fabricElement.hasControls = false;
  }

  move(offset) {
    this.position = this.position.add(offset);
    this.fabricElement.left = this.position.x;
    this.fabricElement.top = this.position.y;
    this.fabricElement.setCoords();
  }
}
