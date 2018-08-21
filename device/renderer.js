const socket = require("socket.io-client")('http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax : 5000,
  reconnectionAttempts: Infinity
});

const {ipcRenderer} = require('electron')

// Create drawing area
var paper = Raphael("paper", 800, 450);

paper.canvas.style.backgroundColor = '#000000';

var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://127.0.0.1:4040/api/tunnels');
xhr.send();

var ngrok_url = ""

xhr.onreadystatechange = function () {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      ngrok_url = JSON.parse(xhr.responseText);
      console.log(ngrok_url.tunnels[0].public_url);
      document.getElementById('info').innerText =
        document.getElementById('info').innerText + " " + ngrok_url.tunnels[0].public_url;

    } else {
      console.log('[' + xhr.status + ']: ' + xhr.statusText);
    }
  }
};

socket.emit("login", {
  name: makeRandomName(),
  userid: "ungmo2@gmail.com"
});

socket.on("login", function(data) {
  console.log(data + " has joined");
  document.getElementById('info').innerText =
    document.getElementById('info').innerText + " joined";
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