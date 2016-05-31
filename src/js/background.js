'use strict';

var handler = {

  fragments: null,

  tab: null,
  tabId: 0,
  windowId: 0,
  captureCmd: '',

  initContextMenu: function () {},

  queryActiveTab: function (callback) {

    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, function (tabs) {

      var tab = tabs && tabs[0] || {};

      handler.tab      = tab;
      handler.tabId    = tab.id;
      handler.windowId = tab.windowId;

      callback && callback(tab);
    });
  },

  checkContentScript: function () {

    handler.queryActiveTab(function () {
      handler.executeScript({
        file: "js/isLoaded.js"
      });
    });
  },

  injectContentScript: function () {

    handler.executeScript({ file: "js/content.js" }, function () {
      handler.onContentReady();
    });
  },

  executeScript: function (details, callback) {

    if (handler.tabId) {
      chrome.tabs.executeScript(handler.tabId, details, callback);
    }
  },

  onContentReady: function () {

    if (handler.captureCmd) {
      handler.sendCaptureCmd(handler.captureCmd);
      handler.captureCmd = '';
    }
  },

  sendCaptureCmd: function (cmd) {

    handler.queryActiveTab(function (tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: cmd
      });
    });
  },

  captureElement: function () {

    // capture the selected html element
    handler.captureCmd = 'captureElement';
    handler.checkContentScript();
  },

  captureRegion: function () {

    // capture the crop region
    handler.captureCmd = 'captureRegion';
    handler.checkContentScript();
  },

  captureEntire: function () {

    // capture entire page
    handler.captureCmd = 'captureEntire';
    handler.checkContentScript();
  },

  captureVisible: function () {

    // capture the visible part of page
    handler.captureCmd = 'captureVisible';
    handler.checkContentScript();
  },

  captureWindow: function () {

    // capture desktop window
  },

  editContent: function () {

    // TODO: 更好的编辑模式提示，可离开编辑模式

    handler.queryActiveTab(function () {
      handler.executeScript({
        allFrames: true,
        code: 'document.designMode="on"'
      }, function () {
        alert('Now you can edit this page');
      });
    });
  },

  clearFragments: function () {

    handler.fragments = null;
  },

  onFragment: function (message, sender) {

    chrome.tabs.captureVisibleTab(sender.tab.windowId, {
      format: 'png'
    }, function (dataURI) {

      var fragments = handler.fragments;
      var fragment  = message.fragment;

      fragment.dataURI = dataURI;

      if (!fragments) {
        fragments = handler.fragments = [];
      }

      fragments.push(fragment);

      chrome.tabs.sendMessage(sender.tab.id, { action: 'nextFragment' });
    });
  },

  onCaptureEnd: function (message, sender) {

    var fragments = handler.fragments;
    if (fragments && fragments.length) {

      var fragment    = fragments[0];
      var totalWidth  = fragment.totalWidth;
      var totalHeight = fragment.totalHeight;

      if (fragment.ratio !== 1) {
        totalWidth *= fragment.ratio;
        totalHeight *= fragment.ratio;
      }

      var canvas  = document.createElement('canvas');
      var context = canvas.getContext('2d');

      canvas.width  = Math.round(totalWidth);
      canvas.height = Math.round(totalHeight);

      var totalCount  = fragments.length;
      var loadedCount = 0;

      fragments.forEach(function (data) {

        var image  = new Image();
        var ratio  = data.ratio;
        var sx     = Math.round(data.sx * ratio);
        var sy     = Math.round(data.sy * ratio);
        var dx     = Math.round(data.dx * ratio);
        var dy     = Math.round(data.dy * ratio);
        var width  = Math.round(data.width * ratio);
        var height = Math.round(data.height * ratio);

        image.onload = function () {
          context.drawImage(image,
            sx, sy,
            width, height,
            dx, dy,
            width, height
          );

          loadedCount++;

          if (loadedCount === totalCount) {
            handler.clearFragments();

            var croppedDataUrl = canvas.toDataURL('image/png');

            chrome.tabs.create({
              url: croppedDataUrl,
              windowId: sender.tab.windowId
            });
          }
        };

        image.src = data.dataURI;
      });
    }

    console.log(fragments);
  },
};


// handle message from tabs
chrome.runtime.onMessage.addListener(function (message, sender, callback) {

  console.log(message);

  if (!sender || sender.id !== chrome.runtime.id || !sender.tab) {
    return;
  }

  var action = message.action;
  if (action && handler[action]) {
    return handler[action](message, sender, callback);
  }
});
