const socket = require("socket.io-client")('http://localhost:3000');
const {ipcRenderer} = require('electron')

// Create drawing area
var paper = Raphael("paper", 800, 450);

paper.canvas.style.backgroundColor = '#000000';

socket.emit("login", {
  name: makeRandomName(),
  userid: "ungmo2@gmail.com"
});

socket.on("login", function(data) {
  console.log(data + " has joined");
});

var paper_shapes = []

socket.on("chat", function(data) {
  var command = JSON.parse(data.msg);
  console.log(command);
  switch (command.command) {
    case 'paper':
      ipcRenderer.send('stop')
      if (paper_shapes[command.id] === void 0) {
        paper_shapes = paper.add([command.data]);
      } else {
        Object.keys(command.data).forEach(key => {
          paper_shapes[command.id].attr(key, command.data[key]);
        })
      }
    break;
    case 'run':
      paper_shapes.forEach(shape => {
        shape.remove();
      });
      paper_shapes = [];
      ipcRenderer.sendSync('stop');
      ipcRenderer.send('run', [command.data]);
    break;
  }
});

function makeRandomName(){
  var name = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";
  for( var i = 0; i < 3; i++ ) {
    name += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return name;
};