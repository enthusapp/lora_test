'use strict';

var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const fs = require("fs")

var config = require('./config');
var api = require('./lib/api');

var mdata = [];

fs.readFile('map.txt', (err, data) => {
  if (err) {
      return;
  }
  mdata = [];
  var device = 1;
  data.toString().match(/[^\r\n]+/g).forEach(el => {
    if (el.match('FPGA')) {
      device++;
    } else {
      var es = el.split('"');
      mdata.push({
        x: parseInt(es[1], 2) - 1,
        y: parseInt(es[3], 2) - 1,
        id: device.toString() + '-' + (parseInt(es[5], 2) + 1).toString()
      });
    }
  });
  console.log(mdata)
})

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res){
  res.redirect('index.html');
});

app.get('/map', function(req, res) {
  res.send(mdata);
});

app.get('/config', function(req,res) {
  api.createNode(config.nodeID, function(err,nodeRI){
    if(err) return res.send(err);
    config.nodeRI = nodeRI;
    res.send(config);
  });
});

app.get('/data/:container', function(req,res) {
  var container = req.params.container;
  api.getLatestContainer(config.nodeID, container, function(err, data){
    if(err) return res.send(err);
    else return res.send(data);
  });
});

app.post('/control', function(req,res) {
  var cmd = req.body['suggest'].substr(1);
  console.log('send:' + cmd)
  api.reqMgmtCmd(config.nodeRI, config.command, cmd, function(err,data){
    if(err) return res.send({'error':err});
    return res.send({'result':'ok'});
  });
});

var server = http.createServer(app);
var io = require('socket.io')(server);

// connection event handler
// connection이 수립되면 event handler function의 인자로 socket인 들어온다
io.on('connection', function(socket) {

  // 접속한 클라이언트의 정보가 수신되면
  socket.on('login', function(data) {
    console.log('Client logged-in:\n name:' + data.name + '\n userid: ' + data.userid);

    // socket에 클라이언트 정보를 저장한다
    socket.name = data.name;
    socket.userid = data.userid;

    // 접속된 모든 클라이언트에게 메시지를 전송한다
    io.emit('login', data.name );
  });

  // 클라이언트로부터의 메시지가 수신되면
  socket.on('chat', function(data) {
    console.log('Message from %s: %s', socket.name, data.msg);

    var msg = {
      from: {
        name: socket.name,
        userid: socket.userid
      },
      msg: data.msg
    };

    // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
    socket.broadcast.emit('chat', msg);

    // 메시지를 전송한 클라이언트에게만 메시지를 전송한다
    // socket.emit('s2c chat', msg);

    // 접속된 모든 클라이언트에게 메시지를 전송한다
    // io.emit('s2c chat', msg);

    // 특정 클라이언트에게만 메시지를 전송한다
    // io.to(id).emit('s2c chat', data);
  });

  // force client disconnect from server
  socket.on('forceDisconnect', function() {
    socket.disconnect();
  })

  socket.on('disconnect', function() {
    console.log('user disconnected: ' + socket.name);
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server for sample dashboard listening on port:'+ app.get('port'));
  console.log('Open the link : http://localhost:'+app.get('port'));
});