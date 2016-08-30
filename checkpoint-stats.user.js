// ==UserScript==
// @id             iitc-plugin-checkpoint-stats@nobody889
// @name           IITC plugin: Show current/upcoming checkpoint stats
// @category       Info
// @version        0.1.0
// @namespace      https://github.com/lithium/iitc-plugin-checkpoint-stats
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUIsLDNAME@@-@@BUILDDATE@@] Show the remaining time until the next checkpoint.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
//plugin_info.buildName = 'jonatkins';
//plugin_info.dateTimeVersion = '20150917.154202';
//plugin_info.pluginId = 'score-cycle-times';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.checkpointStats = function() {};

window.plugin.checkpointStats.CHECKPOINT = 5*60*60; //5 hours per checkpoint
window.plugin.checkpointStats.CYCLE = 7*25*60*60; //7 25 hour 'days' per cycle


window.plugin.checkpointStats.setup  = function() {

  // add a div to the sidebar, and basic style
  $('#sidebar').append('<div id="checkpoint_stats_display"></div>');
  $('#checkpoint_stats_display').css({'color':'#ffce00'});


  window.plugin.checkpointStats.update();
};


window.plugin.checkpointStats.dateFormat = function(date) {
  var monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  var dayNames = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
  ];

  var day = date.getDate();
  var dayIndex = date.getDay();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  var hours = date.getHours();

  return dayNames[dayIndex]+' '+monthNames[monthIndex]+' '+day+' '+hours+':00';
};


window.plugin.checkpointStats.readableUntil = function(date, whence) {
  var whence = whence || new Date();

  var duration = (date.getTime() - whence.getTime()) / 1000;

  if (duration > 86400) {
    return Math.floor(duration/86400)+ ' days'
  }
  else if (duration > 3600) {
    return '<'+Math.ceil(duration/3600)+ ' hours'
  }
  else {
    return Math.floor(duration/60)+ ' minutes'
  }

}


window.plugin.checkpointStats.update = function() {
  // checkpoint and cycle start times are based on a simple modulus of the timestamp
  // no special epoch (other than the unix timestamp/javascript's 1970-01-01 00:00 UTC) is required

  // when regional scoreboards were introduced, the first cycle would have started at 2014-01-15 10:00 UTC - but it was
  // a few checkpoints in when scores were first added

  var now = new Date().getTime();

  var cycleStart = Math.floor(now / (window.plugin.checkpointStats.CYCLE*1000)) * (window.plugin.checkpointStats.CYCLE*1000);
  var cycleEnd = cycleStart + window.plugin.checkpointStats.CYCLE*1000;

  var checkpointStart = Math.floor(now / (window.plugin.checkpointStats.CHECKPOINT*1000)) * (window.plugin.checkpointStats.CHECKPOINT*1000);
  var checkpointEnd = checkpointStart + window.plugin.checkpointStats.CHECKPOINT*1000;


  var formatRow = function(label,time) {
    var d = new Date(time);
    var timeStr = window.plugin.checkpointStats.dateFormat(d);
    var remainStr = window.plugin.checkpointStats.readableUntil(d);

    return '<tr><td>'+label+'</td><td>'+timeStr+'</td>'+'</td><td>'+remainStr+'</td></tr>';
  };

  var html = '<table>'
           + formatRow('Checkpoint', checkpointEnd)
           + formatRow('Cycle', cycleEnd)
           + '</table>';

  $('#checkpoint_stats_display').html(html);

  setTimeout ( window.plugin.checkpointStats.update, checkpointEnd-now);
};





var setup =  window.plugin.checkpointStats.setup;

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


