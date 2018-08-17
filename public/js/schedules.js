let schedule_template = () => pug`
    h4 Month Setting
    p
        ${Array(12).fill(1).map((v, i) => pug`
            button#month${i + 1}[type=button class="btn btn-primary btn-xs"]
                ${i + 1}
            |`
        )}
    h4 Day Setting
    p
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((v, i) => pug`
            button#day${i}[type=button class="btn btn-primary btn-xs"]
                ${v}
            |`
        )}
    h4 Hour Setting
    p
        ${Array(24).fill(1).map((v, i) => pug`
            button#hour${i}[type=button class="btn btn-primary btn-xs"]
                ${i}
            |`
        )}
    h4 Minute Setting
    p
        ${Array(60).fill(1).map((v, i) => pug`
            button#minute${i}[type=button class="btn btn-primary btn-xs"]
                ${i}
            |`
        )}`;

$(".sch-edit").append(schedule_template());

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

$(".sch-media").on("click", ev => {
  socket.emit("chat", { msg: JSON.stringify({
	command: "run",
    data: {
      media: ev.target.innerText,
      height: 200,
      width: 400,
      x: 0,
      y: 0,
      enable: 1,
      month: Array(12).fill(1),
      hour: Array(24).fill(1),
      day: Array(7).fill(1),
      minute: Array(60).fill(1)
    }
  })});
})