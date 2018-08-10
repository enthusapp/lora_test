const socket = require("socket.io-client")('http://localhost:3000');

// Create drawing area
var paper = Raphael("paper", 800, 400);

paper.canvas.style.backgroundColor = '#000000';

socket.emit("login", {
  name: makeRandomName(),
  userid: "ungmo2@gmail.com"
});

socket.on("login", function(data) {
  console.log(data + " has joined");
});

socket.on("chat", function(data) {
  var command = JSON.parse(data.msg);
  console.log(command);
  if (command.command === 'paper') {
    paper.add([command.data]);
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

//  socket.emit("chat", { msg: "test2" });