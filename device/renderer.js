// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// renderer 프로세스(웹 페이지)안에서
const {ipcRenderer} = require('electron')
const {dialog} = require('electron').remote
const _ = require("underscore")
const socket = require("socket.io-client")('http://localhost:3000');

socket.emit("login", {
  name: makeRandomName(),
  userid: "ungmo2@gmail.com"
});

socket.on("login", function(data) {
  console.log(data + " has joined");
});

socket.on("chat", function(data) {
  console.log(data.msg + " : from " + data.from.name);
});

$("form").submit(function(e) {
  socket.emit("chat", { msg: $msgForm.val() });
});

function makeRandomName(){
  var name = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";
  for( var i = 0; i < 3; i++ ) {
    name += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return name;
};

var insertNewSchedule
var displayScheduleTable
var undoScheduleEdit
var pushSchedule
var getSchedule
var addSchedule
var delSchedule

const newScheduleItem = {
  media: "rainbow.swf",
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

var arrayPush = (list) => (data) => {
  var newData = _.last(list).schedule.slice()
  newData.push(data)
  return newData
}
var arrayDel = (list) => (idx) => {
  var newData = _.last(list).schedule.slice()
  newData.splice(idx, 1)
  return newData
}

function initSchedule(dbdata) {
  var scheduleHistory = []

  getSchedule = () => {return _.last(scheduleHistory).schedule}
  pushSchedule = (diffData) => (data) => {
    scheduleHistory.push({schedule: data, diff: diffData})
    ipcRenderer.send('update_schedule_data', data)
    return data
  }
  var pushAddSchedule = pushSchedule({type: 'add'})
  var pushDelSchedule = pushSchedule({type: 'del'})

  addSchedule = _.compose(
    pushAddSchedule,
    arrayPush(scheduleHistory)
  )
  delSchedule = _.compose(
    pushDelSchedule,
    arrayDel(scheduleHistory)
  )

  displayScheduleTable = displayScheduleTableMaker(scheduleHistory)
  insertNewSchedule = () => {
    displayScheduleTable(addSchedule(_.clone(newScheduleItem)))
  }
  undoScheduleEdit = () => {
    if (scheduleHistory.length > 1) {
      var diff = _.last(scheduleHistory).diff
      switch (diff.type) {
        default:
          scheduleHistory.splice(scheduleHistory.length - 1, 1)
          displayScheduleTable(_.last(scheduleHistory).schedule)
          break;
        case 'x':
        case 'y':
        case 'width':
        case 'height':
        case 'media':
          var data = _.last(scheduleHistory).schedule
          var scheduleId = diff.idx
          var timeType = diff.type
          var previous = diff.previous
          var el = document.getElementById(`${timeType}_${scheduleId}`)

          data[scheduleId][timeType] = previous
          el.value = previous
          scheduleHistory.splice(scheduleHistory.length - 1, 1)
          ipcRenderer.send('update_schedule_data', data)
          break;
        case 'enable':
          var data = _.last(scheduleHistory).schedule
          var scheduleId = diff.idx
          var timeType = diff.type
          var previous = diff.previous
          var el = document.getElementById(`${timeType}_${scheduleId}`)

          if (el.checked) {
            el.checked = false
            data[scheduleId][timeType] = 0
          } else {
            el.checked = true
            data[scheduleId][timeType] = 1
          }
          scheduleHistory.splice(scheduleHistory.length - 1, 1)
          ipcRenderer.send('update_schedule_data', data)
          break;
        case 'day':
        case 'month':
        case 'hour':
        case 'minute':
          var data = _.last(scheduleHistory).schedule
          var scheduleId = diff.idx
          var timeType = diff.type
          var timeIdx = diff.time
          var el = document.getElementById(`${timeType}_${scheduleId}_${timeIdx}`)

          if (el.getAttribute('checked') == 'true') {
            el.setAttribute('checked', 'false')
            data[scheduleId][timeType][timeIdx] = 0
          } else {
            el.setAttribute('checked', 'true')
            data[scheduleId][timeType][timeIdx] = 1
          }
          scheduleHistory.splice(scheduleHistory.length - 1, 1)
          ipcRenderer.send('update_schedule_data', data)
          break;
      }
    }
  }

  pushAddSchedule(dbdata)
  displayScheduleTable(dbdata)
}

function editScheduleTime(ev) {
  var newList = getSchedule().slice()
  var id = ev.target.id.split('_')
  var scheduleId = parseInt(id[1])
  var timeType = id[0]
  var timeIdx = parseInt(id[2])

  if (ev.target.getAttribute('checked') == 'true') {
    ev.target.setAttribute('checked', 'false')
    newList[scheduleId][timeType][timeIdx] = 0
  } else {
    ev.target.setAttribute('checked', 'true')
    newList[scheduleId][timeType][timeIdx] = 1
  }

  pushSchedule({idx: scheduleId, time: timeIdx, type: timeType})(newList)
}

function deleteSchedule(ev) {
  const options = {
    type: 'warning',
    title: '스케쥴 삭제',
    message: "스케쥴을 정말로 삭제 하겠습니까?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(options, (index) => {
    if (index === 0) {
      displayScheduleTable(delSchedule(ev.target.parentElement.id))
    }
  })
}

function makeScheduleButton(val, type, pid, textList) {
  var str = '<label class="btn-time-set"><p>'
  var i = 0
  for (const el of val[type]) {
    str += `<a class="btn-time" checked=` + (!!el).toString()
    str += ` id="${type}_${pid}_${i}"`
    str += `>${textList[i]}</a> `
    if (++i == 30) {
      str += '</p><p>'
    }
  }
  return str + '</p></label>'
}

function changeScheduleParameter(ev) {
  var newList = getSchedule().slice()
  var id = ev.target.id.split('_')
  var scheduleId = parseInt(id[1])
  var timeType = id[0]
  var previousValue = newList[scheduleId][timeType]

  switch (ev.target.getAttribute('type')) {
    case 'number':
      newList[scheduleId][timeType] = parseInt(ev.target.value)
      break;
    case 'checkbox':
      newList[scheduleId][timeType] = ev.target.checked ? 1 : 0
      break;
    default:
      newList[scheduleId][timeType] = ev.target.value
      break;
  }
  pushSchedule({idx: scheduleId, previous: previousValue, type: timeType})(newList)
}

function makeScheduleInput(val, index, type) {
  var str = `<div class="input-field col s3">`
  str += `<input type="number" class="schedule_postion validate" id="${type}_${index}"`
  str += ` name="amount" value=${val[type]} min="-100" max="8000">`
  str += `<label for="${type}_${index}">${type.toUpperCase()}</label></div>`
  return str
}

function makeSchedulePosition(val, index) {
  var str = '<div class="row">'
  str += makeScheduleInput(val, index, 'x')
  str += makeScheduleInput(val, index, 'y')
  str += makeScheduleInput(val, index, 'width')
  str += makeScheduleInput(val, index, 'height')
  return str + '</div>'
}

function displayScheduleTableMaker(history) {
  return function(list) {
    var contents = ''
    var index = 0

    for (const val of list) {
      contents += `<li><div class="collapsible-header">`
      contents += `<table class="striped"><thead><tr><td>스케쥴 ${index}</td>`
      contents += `<td><label class="right"><input id="enable_${index}" type="checkbox"`
      contents += 'class="schedule_enable filled-in"'
      contents += val.enable ? 'checked/>' : '/>'
      contents += '<span>활성화</span></label></td>'
      contents += '</tr></thead></table></div>'

      contents += `<div id="${index}" class="collapsible-body">`
      contents += '<a class="btn-small schedule_test">테스트</a>'
      contents += '<a class="btn-small schedule-del right">삭제</a>'

      contents += '<div class="file-field input-field"><div class="btn"><span>File</span>'
      contents += `<input type="file" accept=".swf"></div><div class="file-path-wrapper">`
      contents += `<input id="media_${index}" class="schedule_media file-path validate" `
      contents += `value=${val.media} type="text"></div></div>`

      contents += '<p>위치 설정' + makeSchedulePosition(val, index)
      contents += '</p><p>월 설정'
      contents += makeScheduleButton(val, 'month', index, _.range(1, 13))
      contents += '</p><p>요일 설정'
      contents += makeScheduleButton(val, 'day', index, ['일', '월', '화', '수', '목', '금', '토'])
      contents += '</p><p>시간 설정'
      contents += makeScheduleButton(val, 'hour', index, _.range(0, 24))
      contents += '</p><p>분 설정' + makeScheduleButton(val, 'minute', index, _.range(0, 60))
      contents += '</p></div></li>'
      index++;
    }
    $("#schedule-table").html(contents);

    M.Collapsible.init(document.querySelector('.collapsible.expandable'), {
      accordion: false
    });

    $('.schedule_test').click(ev => {
      var tdata = getSchedule()[ev.target.parentElement.id]
      var data = _.clone(newScheduleItem)

      data.media = tdata.media
      data.height = tdata.height
      data.width = tdata.width
      data.x = tdata.x
      data.y = tdata.y

      ipcRenderer.sendSync('stop')
      ipcRenderer.send('run', [data])
      changeButtonSet(1)
    })
    $('.schedule_enable').change(changeScheduleParameter)
    $('.schedule_media').change(changeScheduleParameter)
    $('.schedule_postion').change(changeScheduleParameter)
    $(".btn-time").click(editScheduleTime)
    $(".schedule-del").click(deleteSchedule)
  }
}

function startScheduler () {
  /*
  ipcRenderer.send('run', getSchedule())
  console.log('start')
  */
  socket.emit("chat", { msg: "test1" });
}

function stopScheduler () {
  /*
  ipcRenderer.send('stop')
  console.log('stop')
  */
  socket.emit("chat", { msg: "test2" });
}

function requestSchedulerData () {
  initSchedule(ipcRenderer.sendSync('request_schedule_data'))
}
//requestSchedulerData()

const changeButton = {
  'run': [{
    text: '재생 시작',
    action: startScheduler,
    next: 1
  }, {
    text: '정지',
    action: stopScheduler,
    next: 0
  }] 
}

var changeButtonSet

$.each(changeButton, (key, value) => {
  var bt = $('#' + key)
  bt.html(value[0].text)
  bt.on('click', () => {
    var index = _.findIndex(value, el => el.text.match(bt.text()))
    bt.html(value[value[index].next].text)
    value[index].action()
  })
  changeButtonSet = (idx) => {
    bt.html(value[idx].text)
  }
})

$('#add').click(ev => {
  insertNewSchedule()
})

$('#undo').click(ev => {
  undoScheduleEdit()
})