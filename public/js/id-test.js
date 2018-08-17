var mdata = [];
var mdata_idx = 0;

class IdButton {
	constructor(el, calculator) {
		this.el = el;
		this.calculator = calculator;
		this.longPressed = false;
		el.addEventListener('mousedown', ()=> {
			this.operate();
			this.pressTimer = window.setTimeout(this.longProcess(this), 500);
			this.longPressed = true;
			this.longCnt = 0;
		});
		el.addEventListener('mouseup', ()=> {
			if (this.longPressed) {
				clearTimeout(this.pressTimer);
				this.longPressed = false;
			}
		});
	}
	operate() {
		setPosition(shapes[0], {
			x: mdata[mdata_idx].x,
			y: mdata[mdata_idx].y},
			`ID: ${mdata[mdata_idx].id}, `);
		this.calculator();
	}
	longProcess(bt) {
		return () => {
			bt.operate();
			bt.longCnt++;
			var delay = 300;
			if (bt.longCnt > 30) {
				delay = 10;
			} else if (bt.longCnt > 15) {
				delay = 50;
			} else if (bt.longCnt > 5) {
				delay = 100;
			}
			bt.pressTimer = window.setTimeout(bt.longProcess(bt), delay);
		}
	}
}

var id_up_button = new IdButton(
	document.getElementById('id_up'),
	() => {
		mdata_idx++;
		mdata_idx %= mdata.length;}
)

var id_down_button = new IdButton(
	document.getElementById('id_down'),
	() => {mdata_idx = mdata_idx ? --mdata_idx : mdata.length - 1;}
)

$.get('/map', function(data, status){
  if(status == 'success'){
	console.log(data);
	mdata = data;
  } else {
    console.log('[Error] /config API return status :' + status);
  }
});

var position = {
	x: 0,
	y: 0,
	width: 250,
	height: 250,
	fill: '#808080'
}

document.getElementById('rect_size').addEventListener('input', (event) => {
	var size = parseInt(event.target.value);
	setPosition(shapes[0], {height: size, width: size});
})

document.getElementById('color_set').addEventListener('input', (event) => {
	var fill = hexToRgb(position.fill);
	fill[event.target.id] = parseInt(event.target.value);
	setPosition(shapes[0], {fill: rgbToHex(fill)});
})

/**
 *  GETTER / SETTER METHOD(s)
 * */
function getX(rect, ddx) {
	var width = rect.paper.width,
		thisBox = rect.getBBox();

	if (ddx < 0) {
		ddx = 0;
	} else if (ddx > width - thisBox.width) {
		ddx = width - thisBox.width;
	}

	return ddx;
}

function getY(rect, ddy) {
	var height = rect.paper.height,
		thisBox = rect.getBBox();

	if (ddy < 0) {
		ddy = 0;
	} else if (ddy > height - thisBox.height) {
		ddy = height - thisBox.height;
	}

	return ddy;
}

function getWidth(rect, ddw) {
	var width = rect.paper.width,
		thisBox = rect.getBBox();

	if (ddw < 1) {
		ddw = 1;
	} else if (ddw > width - thisBox.x) {
		ddw = width - thisBox.x;
	}

	return ddw;
}

function getHeight(rect, ddh) {
	var height = rect.paper.height,
		thisBox = rect.getBBox();

	if (ddh < 1) {
		ddh = 1;
	} else if (ddh > height - thisBox.y) {
		ddh = height - thisBox.y;
	}

	return ddh;
}

/**
 * RAPHAEL EVENT(s)
 * */
function dragStart() {
	this.ox = this.attr('x');
	this.oy = this.attr('y');
	this.ow = this.attr('width');
	this.oh = this.attr('height');
	this.dragging = true;
}

function dragMove(dx, dy) {
	var ddx = this.ox + dx;
	var ddy = this.oy + dy;
	var change;

	switch (this.attr('cursor')) {
		case 'nw-resize':
			change = {
				x: getX(this, ddx),
				y: getY(this, ddy),
				width: getWidth(this, this.ow - dx),
				height: getHeight(this, this.oh - dy)};
			break;
		case 'ne-resize':
			change = {
				y: getY(this, ddy),
				width: getWidth(this, this.ow + dx),
				height: getHeight(this, this.oh - dy)};
			break;
		case 'se-resize':
			change = {
				width: getWidth(this, this.ow + dx),
				height: getHeight(this, this.oh + dy)};
			break;
		case 'sw-resize':
			change = {
				x: getX(this, ddx),
				width: getWidth(this, this.ow - dx),
				height: getHeight(this, this.oh + dy)};
			break;
		case 'w-resize':
			change = {
				x: getX(this, ddx, this.ow - dx),
				width: getWidth(this, this.ow - dx)};
			break;
		case 'e-resize':
			change = {
				width: getWidth(this, this.ow + dx)};
			break;
		case 's-resize':
			change = {
				height: getHeight(this, this.oh + dy)};
			break;
		case 'n-resize':
			change = {
				y: getY(this, ddy),
				height: getHeight(this, this.oh - dy)};
			break;
		default:
			change = {
				x: getX(this, ddx),
				y: getY(this, ddy)};
			break;
	}
	setPosition(this, change)
}

function intToStringFixedLength(len) {
	return (i) => {
		return ('00000' + i).slice(-len);
	}
}

function setPosition(target, p, s = '') {
	var change = {
		changed: false,
		value: 1
	}
	Object.keys(p).forEach(key => {
		target.attr(key, p[key]);
		position[key] = p[key];
		if (key === 'height' || key === 'width') {
			change.changed = true;
			change.value = change.value > p[key] ? change.value : p[key];
		}
	})
	if (change.changed) {
		change.value = change.value > 250 ? 250 : change.value;
		document.getElementById('rect_size').value = change.value;
	}
	var rgb = hexToRgb(position.fill)
	var ic = intToStringFixedLength(3)
	document.getElementById("position").innerText = s + 
		`X: ${ic(position.x)}, Y: ${ic(position.y)}, ` +
		`가로: ${ic(position.width)}, 세로: ${ic(position.height)}, ` +
		`R: ${ic(rgb.red)}, G: ${ic(rgb.green)}, B: ${ic(rgb.blue)}`;

    socket.emit("chat", { msg: JSON.stringify({
	  command: "paper",
	  id: 0,
      data: {
        'type' : 'rect',
        'x' : position.x,
        'y' : position.y,
        'width' : position.width,
        'height' : position.height,
        'fill' : position.fill,
        'stroke-width' : 0
      }
    })});
}

function rgbToHex(c) {
    return "#" + ((1 << 24) + (c.red << 16) + (c.green << 8) + c.blue).toString(16).slice(1);
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        red: parseInt(result[1], 16),
        green: parseInt(result[2], 16),
        blue: parseInt(result[3], 16)
    } : null;
}

function dragEnd(e) {
	this.dragging = false;
}

function getOffset(element, position) {
  var bodyRect = document.body.getBoundingClientRect(),
    elemRect = element.getBoundingClientRect(),
    offset   = elemRect[position] - bodyRect[position];
  return offset;
}

function changeCursor(e, mouseX, mouseY) {
	if (this.dragging === true) {
		return;
	}
	var paper_el = document.getElementById('paper')

	var relativeX = mouseX - getOffset(paper_el, 'left') - this.attr('x');
	var relativeY = mouseY - getOffset(paper_el, 'top') - this.attr('y');

	var shapeWidth = this.attr('width');
	var shapeHeight = this.attr('height');
	var resizeBorder = 10;

	if (relativeX < resizeBorder && relativeY < resizeBorder) {
		this.attr('cursor', 'nw-resize');
	} else if (relativeX > shapeWidth - resizeBorder && relativeY < resizeBorder) {
		this.attr('cursor', 'ne-resize');
	} else if (relativeX > shapeWidth - resizeBorder && relativeY > shapeHeight - resizeBorder) {
		this.attr('cursor', 'se-resize');
	} else if (relativeX < resizeBorder && relativeY > shapeHeight - resizeBorder) {
		this.attr('cursor', 'sw-resize');
	} else if (relativeX < resizeBorder && relativeY < shapeHeight - resizeBorder) {
		this.attr('cursor', 'w-resize');
	} else if (relativeX > shapeWidth - resizeBorder && relativeY < shapeHeight - resizeBorder) {
		this.attr('cursor', 'e-resize');
	} else if (relativeX > resizeBorder && relativeY > shapeHeight - resizeBorder) {
		this.attr('cursor', 's-resize');
	} else if (relativeX > resizeBorder && relativeY < resizeBorder) {
		this.attr('cursor', 'n-resize');
	} else {
		this.attr('cursor', 'move');
	}
}

// Create drawing area
var paper = Raphael("paper", screen.width > 800 ? 800 : screen.width - 60, 250);

paper.canvas.style.backgroundColor = '#000000';

// Add a rectangle
var shapes = paper.add([{
    'type' : 'rect',
    'x' : 0,
    'y' : 0,
    'width' : 250,
    'height' : 250,
    'fill' : '#808080',
    'stroke-width' : 0
}]);

// Attach "Mouse Over" handler to rectangle
shapes[0].mousemove(changeCursor);

// Attach "Drag" handlers to rectangle
shapes[0].drag(dragMove, dragStart, dragEnd);

var socket = io();

socket.emit("login", {
  name: makeRandomName(),
  userid: "ungmo2@gmail.com"
});

function makeRandomName(){
  var name = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";
  for( var i = 0; i < 3; i++ ) {
    name += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return name;
};