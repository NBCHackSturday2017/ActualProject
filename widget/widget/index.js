// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var widgetHTML = '<div id="my-nbc" style="width: 100%; background: #4d228e; padding-top: 30px; padding-bottom: 25px;">\
<div id="wb_Text1" style="height:25px;text-align:left;">\
<span style="color:#fcfcfc;font-family:Lato,Helvetica,Arial,sans-serif;font-weight:600;font-size:16px;margin:0 0 0 16px;">MyNBC Also Recommends</span></div>\
<div id="wb_Image1" style="display: inline-block;z-index:2; ">\
<img src="Image1-id" id="Image1" alt="" style="width:18vw;height:auto;margin:0 10px;"></div>\
<div id="wb_Image2" style="display: inline-block;z-index:3;">\
<img src="Image2-id" id="Image2" alt="" style="width:18vw;height:auto;margin:0 10px;"></div>\
<div id="wb_Image3" style="display: inline-block;z-index:4;">\
<img src="Image3-id" id="Image3" alt="" style="width:18vw;height:auto;margin:0 10px;"></div>\
<div id="wb_Image4" style="display: inline-block;z-index:5;">\
<img src="Image4-id" id="Image4" alt="" style="width:18vw;height:auto;margin:0 10px;"></div>\
<div id="wb_Image5" style="display: inline-block;z-index:6;">\
<img src="Image5-id" id="Image5" alt="" style="width:18vw;height:auto;margin:0 10px;"></div>\
</div>';

// var TARGET_DOMAINS = ['bravotv.com', 'usanetwork.com', 'eonline.com', 'telemundo.com', 'syfy.com'];
var TARGET_DOMAINS = ['bravotv.com'];

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
 console.log('hi');
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
});

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, (tabs) => {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * Change the background color of the current page.
 *
 * @param {string} color The new background color.
 */
function changeBackgroundColor(color) {
  var script = 'document.body.style.backgroundColor="' + color + '";';
  // See https://developer.chrome.com/extensions/tabs#method-executeScript.
  // chrome.tabs.executeScript allows us to programmatically inject JavaScript
  // into a page. Since we omit the optional first argument "tabId", the script
  // is inserted into the active tab of the current window, which serves as the
  // default.
  chrome.tabs.executeScript({
    code: script
  });
}

function isTargetDomain(url) {
    for (var i in TARGET_DOMAINS) {
        var d = TARGET_DOMAINS[i];
        if (url.indexOf(d) > -1) { return true; }
    }
    return false;
}

function getImage(show, i) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:8000/showImage/" + show, false);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
          var resp = JSON.parse(xhr.responseText);
          widgetHTML = widgetHTML.replace("Image"+i+"-id", resp.image);
      }
    }
    xhr.send();
}

function loadMyNBCWidget() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:8000/recommendedShows/9c4baed4d9635984dbc0e2c229cde57992e5104d63dc6e59727017ec8680dc7f", false);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        // JSON.parse does not evaluate the attacker's scripts.
        var resp = JSON.parse(xhr.responseText);

        for (var i=0; i<5; i++) {
            getImage(resp[i], i+1);
        }
        //bravotv
        var script = "document.getElementsByClassName('advertisement')[0].innerHTML = '"  + widgetHTML + "';";
        chrome.tabs.executeScript({
            code: script
        });
        //usanetwork
        var script = "document.getElementsByClassName('ad-leaderboard')[0].innerHTML = '"  + widgetHTML + "';";
        chrome.tabs.executeScript({
            code: script
        });

        for (var i=0; i<5; i++) {
            var show = resp[i];
            var script1 = "document.getElementById('Image" + (i+1) + "').addEventListener('click', function() {\
                deepLink('" + show + "');\
            });"
            chrome.tabs.executeScript({
                code: script1
            });
        }

      }
    }
    xhr.send();
}

// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
document.addEventListener('DOMContentLoaded', function() {
    console.log('yo');
    getCurrentTabUrl(function (url) {
        if (isTargetDomain(url)) {
            loadMyNBCWidget();
        }
    },false);

});

function deepLink(show) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:8000/playShow/" + show, false);
    xhr.onreadystatechange = function() {
        var resp = JSON.parse(xhr.responseText);
    // alert("Now playing " + resp.name + " on the Roku");
    }
    xhr.send();
}
