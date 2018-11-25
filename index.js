const radio = document.querySelectorAll('input[type=radio][name=svg]');

radio.forEach(selected => {
  selected.addEventListener('change', v => {
    const newValue = v.target.value;
    changePattern(newValue);
  });
});

let selectedSVG;

function changePattern(svgName) {
  selectedSVG = fetch(`./svgs/${svgName}.svg`)
    .then(r => r.text())
    .then(text => {
      const container = document.createElement('div');
      container.innerHTML = text;
      return container.children[0];
    })
    // .then(svg => flatten(svg))
    .then(svg => {
      console.log('Changing svg');
      return {
        svg: svg,
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height')
      }
    });
  selectedSVG.then(()=>{warpIfNotAlready()})
}

changePattern('square');

const scaleElement = document.getElementById('scale');
