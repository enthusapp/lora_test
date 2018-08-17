const {app, ipcMain, BrowserWindow} = require('electron');
const TinyDB = require('tinydb')
const path = require('path');
const debug = /--debug/.test(process.argv[2])
const _ = require("underscore")

let mainWindow;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    app.quit();
});

let ppapi_flash_path;

if(process.platform  == 'win32'){
  ppapi_flash_path = path.join(__dirname, 'pepflashplayer.dll');
} else if (process.platform == 'linux') {
  ppapi_flash_path = path.join(__dirname, 'libpepflashplayer.so');
} else if (process.platform == 'darwin') {
  ppapi_flash_path = path.join(__dirname, 'PepperFlashPlayer.plugin');
}

app.commandLine.appendSwitch('ppapi-flash-path', ppapi_flash_path);
app.commandLine.appendSwitch('ppapi-flash-version', '18.0.0.203');

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    'width': 1000,
    'height': 1000,
    'frame': false,
    backgroundColor: '#000000',
    'webPreferences': {'plugins': true}
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`)
  //if (debug) {
    //mainWindow.webContents.openDevTools()
  //}
  mainWindow.on('close', () => { app.quit(); })
});

app.on('before-quit', () => {
  saveDB()
})

function playingStop (el) {
  var text = el.hasOwnProperty('_id') ? el._id : el.media
  console.log(new Date().toISOString() + ': playing stop: ' + text)
  el.player.close()
}

function playingCheckStop (el) {
  if (el.playing) {
    el.playing = false
    playingStop(el)
  }
}

function playingStart (el) {
  var text = el.hasOwnProperty('_id') ? el._id : el.media
  console.log(new Date().toISOString() + ': playing start: ' + text)

  el.player = new BrowserWindow({
    'width': el.width,
    'height': el.height,
    'webPreferences': {
      'plugins': true,
      nodeIntegrationInWorker: true},
    'frame': false,
    backgroundColor: '#000000'
  });
  el.player.setPosition(el.x, el.y);
  el.player.loadURL(`file://${__dirname}/player.html?media=${el.media}`)
}

function playingCheckStart (el) {
  if (el.playing) {
    return
  }
  el.playing = true
  playingStart(el)
}

function SchedulePlayer (scheduleData) {
  return () => {
    var d = new Date()

    scheduleData.forEach(el => {
      if (!el.enable) {
        playingCheckStop(el)
        return
      }
      if (!el.month[d.getMonth()]) {
        playingCheckStop(el)
        return
      }
      if (!el.hour[d.getHours()]) {
        playingCheckStop(el)
        return
      }
      if (!el.day[d.getDay()]) {
        playingCheckStop(el)
        return
      }
      if (!el.minute[d.getMinutes()]) {
        playingCheckStop(el)
        return
      }
      playingCheckStart(el)
    });
  }
}

var scheduler = { data: [] }

ipcMain.on('run', (event, arg) => {
  var scheduleData = arg.map(el => {
    el.playing = false
    return el
  })
  scheduler = setInterval(SchedulePlayer(scheduleData), 1000)
  scheduler.data = scheduleData
})

ipcMain.on('stop', (event, arg) => {
  scheduler.data.forEach(el => playingCheckStop(el))
  clearInterval(scheduler)
  event.returnValue = 'stop'
})

ipcMain.on('update_schedule_data', (event, arg) => {
  updateScheduleData(arg)
})

var saveDB
var updateScheduleData

ipcMain.on('request_schedule_data', (event, arg) => {
  var db = new TinyDB('db.json')
  var scheduleData = []

  db.onReady = () => {
    db.forEach((err, item) => {
      scheduleData.push(item)
    })
    db.update = (id, newItem, callback) => {
      db.findById(id, (err, item, idx) => {
        db._data.data[idx] = newItem
      })
    }

    updateScheduleData = (arg) => { scheduleData = arg }
    saveDB = () => {
      scheduleData.forEach(el => {
        if (el.hasOwnProperty('_id')) {
          db.update(el._id, el)
        } else {
          db.insertItem(el, (err, item) => {
            el._id = item._id
          })
        }
      })

      db.forEach((err, el) => {
        if (!_.some(scheduleData, val => val._id === el._id)) {
          db.findByIdAndRemove(el._id)
        }
      })
      db.flush()
    }
    event.returnValue = scheduleData
  }
})