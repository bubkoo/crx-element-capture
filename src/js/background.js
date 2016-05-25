'use strict';

var screenShot;

(function () {

  var fragments;

  screenShot = {

    initContextMenu: function () {},

    queryActiveTab: function (callback) {
      if (callback) {
        chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        }, function (tabs) {
          callback(tabs[0]);
        });
      }
    },

    // capture the selected element
    captureElement: function (message, sender) {
      screenShot.queryActiveTab(function (tab) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'captureElement'
        }, function () {

          if (screenShot.canvas) {
            var croppedDataUrl = screenShot.canvas.toDataURL('image/png');
            chrome.tabs.create({
              url: croppedDataUrl,
              windowId: sender.tab.windowId
            });
          }
        });
      });

      return true;
    },

    // capture the selected region
    captureRegion: function () {
      screenShot.queryActiveTab(function (tab) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'captureRegion'
        });
      });
    },

    // capture entire page
    captureEntire: function () {
      screenShot.queryActiveTab(function (tab) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'captureEntire'
        });
      });
    },

    // capture the visible part of page
    captureVisible: function () {},

    // capture desktop window
    captureWindow: function () {},

    capture: function (data, sender, callback) {

      console.log('capture');
      console.log(data);

      var scale = data.ratio && data.ratio !== 1 ? 1 / data.ratio : 1;

      if (scale !== 1) {
        data.sx          = data.sx / scale;
        data.sy          = data.sy / scale;
        data.dx          = data.dx / scale;
        data.dy          = data.dy / scale;
        data.width       = data.width / scale;
        data.height      = data.height / scale;
        data.totalWidth  = data.totalWidth / scale;
        data.totalHeight = data.totalHeight / scale;
      }

      if (!screenShot.canvas) {
        var canvas = document.createElement('canvas');

        canvas.width  = data.totalWidth;
        canvas.height = data.totalHeight;

        screenShot.canvas = canvas;
        screenShot.ctx    = canvas.getContext('2d');
      }

      chrome.tabs.get(sender.tab.id, function (tab) {
        chrome.tabs.captureVisibleTab(tab.windowId, {
          format: 'png'
        }, function (dataUrl) {

          if (dataUrl) {

            var img = new Image();

            img.onload = function () {
              screenShot.ctx.drawImage(img,
                data.sx, data.sy,
                data.width, data.height,
                data.dx, data.dy,
                data.width, data.height
              );
              callback(true);
            };

            img.src = dataUrl;
          }

        });
      });

      // for async callback
      return true;
    },

    onFragment: function (data, sender) {

      chrome.tabs.captureVisibleTab(sender.tab.windowId, {
        format: 'png'
      }, function (dataURI) {

        var fragment = data.fragment;

        fragment.dataURI = dataURI;

        if (!fragments) {
          fragments = [];
        }

        fragments.push(fragment);

        chrome.tabs.sendMessage(sender.tab.id, { action: 'nextFragment' });
      });
    },

    onCaptureEnd: function (message, sender) {

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
              fragments = null;

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

})();


// handle message from tabs
chrome.runtime.onMessage.addListener(function (message, sender, callback) {

  if (!sender || sender.id !== chrome.runtime.id || !sender.tab) {
    return;
  }

  var action = message.action;
  if (action && screenShot[action]) {
    return screenShot[action](message, sender, callback);
  }
});
