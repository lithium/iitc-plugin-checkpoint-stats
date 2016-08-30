// ==UserScript==
// @id             iitc-plugin-checkpoint-stats@nobody889
// @name           IITC plugin: Show current/upcoming checkpoint stats
// @category       Info
// @version        0.1.1
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

  var style = '<style type="text/css">'
            + '.regionName { margin: 0; text-align: center; }'
            + '.scorebarHeader { margin: 25px 0 0 0; font-size: 12px; color: white; }'
            + '.scorebarHeader.nopad { margin: 3px 0 0 0; }'
            + '.scorebar span { display: block; float: left; height: 21px; line-height: 22px;}'
            + '.scorebar .res { background-color: rgb(0,86,132); text-align: left;}'
            + '.scorebar .enl { background-color: rgb(1,127,1); text-align: right;}'
            + '</style>';

  $(style).appendTo("head");

  // add a div to the sidebar, and basic style
  $('#sidebar').append('<div id="checkpoint_stats_previous"></div>');
  $('#checkpoint_stats_previous').css({'color':'#ffce00'});

  window.addHook('mapDataRefreshStart', window.plugin.checkpointStats.fetchRegionScoreboard);
};


window.plugin.checkpointStats.fetchRegionScoreboard = function() {
  var latLng = map.getCenter();
  var latE6 = Math.round(latLng.lat*1E6);
  var lngE6 = Math.round(latLng.lng*1E6);

  window.postAjax('getRegionScoreDetails', {latE6:latE6,lngE6:lngE6}, window.plugin.checkpointStats.regionScoreboardSuccess, window.plugin.checkpointStats.regionScoreboardFailure);
}

window.plugin.checkpointStats.regionScoreboardSuccess = function(result) {
  var gameScore = {
    enl: parseInt(result.result.gameScore[0]),
    res: parseInt(result.result.gameScore[1])
  };
  var lastScore = {
    checkpoint: parseInt(result.result.scoreHistory[0][0]),
    enl: parseInt(result.result.scoreHistory[0][1]),
    res: parseInt(result.result.scoreHistory[0][2])
  }

  var scorebar = function(enl, res, suffix) {
    var enlPercent = (enl / (enl + res))*100;
    var resPercent = 100 - enlPercent;
    var suffix = suffix || '';

    return '<div class="scorebar">'
           + '<span class="enl" style="width: '+enlPercent+'%">'+window.plugin.checkpointStats.muFormat(enl)+suffix+'&nbsp;</span>'
           + '<span class="res" style="width: '+resPercent+'%">&nbsp;'+window.plugin.checkpointStats.muFormat(res)+suffix+'</span>'
           + '<span style="clear: both"></span>'
         + '</div>';
  }

  var now = new Date().getTime();
  var cycleStartInt = Math.floor(now / (window.plugin.checkpointStats.CYCLE*1000)) * (window.plugin.checkpointStats.CYCLE*1000);
  var cycleEnd = new Date(cycleStartInt + window.plugin.checkpointStats.CYCLE*1000);
  var checkpointStartInt = Math.floor(now / (window.plugin.checkpointStats.CHECKPOINT*1000)) * (window.plugin.checkpointStats.CHECKPOINT*1000);
  var checkpointStart = new Date(checkpointStartInt)
  var checkpointEnd = new Date(checkpointStartInt + window.plugin.checkpointStats.CHECKPOINT*1000);

  var checkpointSince = window.plugin.checkpointStats.readableUntil(new Date(), checkpointStart)

  var html = '<p class="regionName">'+result.result.regionName+'</p>'
           + '<p class="scorebarHeader nopad">next checkpoint - '+window.plugin.checkpointStats.dateFormat(checkpointEnd)+' in '+window.plugin.checkpointStats.readableUntil(checkpointEnd)+'</p>'
           + scorebar(gameScore.enl, gameScore.res)
           + '<p class="scorebarHeader">checkpoint #'+lastScore.checkpoint+' - '+window.plugin.checkpointStats.dateFormat(checkpointStart)+' '+checkpointSince+' ago</p>'
           + scorebar(lastScore.enl, lastScore.res, ' mu')
           + '<p class="scorebarHeader">next cycle - '+window.plugin.checkpointStats.dateFormat(cycleEnd)+' in '+window.plugin.checkpointStats.readableUntil(cycleEnd)+'</p>'
           ;

  $('#checkpoint_stats_previous').html(html);
 
}
window.plugin.checkpointStats.regionScoreboardFailure = function(result) {
}

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

window.plugin.checkpointStats.muFormat = function(score) {
  if (score > 1000000) {
    return (score/1000000).toFixed(1)+'M'
  }
  else if (score > 1000) {
    return (score/1000).toFixed(1)+'k'
  }
  return score
}





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


