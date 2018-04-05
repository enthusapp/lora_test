"use strict";

jQuery(document).ready(function() {

  var data = [0];
  /* Graph Related Variables */
  var MAX_DATA = 60;
  var x = null;
  var y = null;
  var line = null;
  var graph = null;
  var xAxis = null;
  var yAxis = null;
  var ld = null;
  var path = null;
  var recent_ri = 0;
  var container_name = 'myContainer';
  getConfig( function(err,config) {
    if(data) container_name = config.containerName;
  });

  function getConfig(cb) {
    var url = '/config';
    $.get(url, function(data, status){
      if(status == 'success'){
        cb(null, data);
      }
      else {
        console.log('[Error] /config API return status :'+status);
        cb({error: status}, null);
      }
    });
  }

  function getData(container, cb) {
    var url = '/data/' + container;
    $.get(url, function(data, status){
      if(status == 'success'){
        var value = data.con;
        var ri = parseInt(data.ri.slice(2, data.ri.length));
        if(ri > recent_ri){
          recent_ri = ri;
        }
        cb(null, value);
      }
      else {
        console.log('[Error] /data API return status :'+status);
        cb({error: status}, null);
      }
    });
  }

  function displayData() {
    $('#temp_value')[0].innerText = data[0];
    $('#temp_time')[0].innerText = new Date().toLocaleString();
  }
  function insertNewData(value){
    if(data.length == MAX_DATA){
      data.pop();
    }
    data.splice(0,0,value);  
  }

  $('#ac_on_btn').on('click', function(event) {
    $.post('/control', {cmd:'on'}, function(data,status){
      console.log(data);
    });
  });

  $('#ac_off_btn').on('click', function(event) {
    $.post('/control', {cmd:'off'}, function(data,status){
      console.log(data);
    });
  });

  $('#send').on('click', () => {
    var color_val = $('#color-infoRGBA')[0].value.split(/\(|\)|,+/g);
    console.log(color_val)
    var i, tablinks = document.getElementsByClassName("tablinks");
    var tabName = null;
    for (i = 0; i < tablinks.length; i++) {
        if (tablinks[i].classList.contains("active")) {
          tabName = tablinks[i].textContent;
        }
    }
    if (tabName == "Color Control") {
      var sd = 'F' + parseInt(color_val[1]).toString(16);
      sd += parseInt(color_val[2]).toString(16);
      sd += parseInt(color_val[3]).toString(16) + 'ff';
      console.log(sd)
      $.post('/control', {suggest: sd.replace(/\s/g, '')}, function(data,status){
        console.log(data);
      });
    } else if (tabName == "Media Select") {
      $.post('/control', {suggest: "FFF000000"}, function(data,status){
        console.log(data);
      });
    }
  });
});