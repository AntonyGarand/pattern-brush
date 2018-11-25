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
