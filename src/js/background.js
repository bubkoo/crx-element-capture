'use strict';

function captureOld(tabId, metadata) {

  chrome.tabs.get(tabId, function (tab) {

    chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }, function (dataUrl) {

      if (!canvas) {
        canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
      }

      var image = new Image();

      image.onload = function () {
        canvas.width  = metadata.width;
        canvas.height = metadata.height;

        var context = canvas.getContext('2d');

        context.drawImage(image,
          metadata.left, metadata.top,
          metadata.width, metadata.height,
          0, 0,
          metadata.width, metadata.height
        );

        var croppedDataUrl = canvas.toDataURL('image/png');

        download(croppedDataUrl, metadata.name);
        // copy to clipboard
        copy(croppedDataUrl);

        //chrome.tabs.create({
        //  url: croppedDataUrl,
        //  windowId: tab.windowId
        //});
      };

      image.src = dataUrl;
    });
  });
}

function download(dataUrl, filename) {
  var a = document.createElement('a');

  document.body.appendChild(a);

  a.setAttribute('download', filename + '.png');
  a.setAttribute('href', dataUrl);
  a.style.display = 'none';
  a.click();
  a.parentNode.removeChild(a);
}

function copy(dataUrl) {

  var img = document.createElement('img');
  img.src = dataUrl;
  document.body.appendChild(img);

  img.onload = function () {

    var selection = window.getSelection();
    var range     = document.createRange();

    selection.removeAllRanges();

    range.setStartBefore(img);
    range.setEndAfter(img);
    range.selectNode(img);

    range.selectNode(img);
    selection.addRange(range);

    document.execCommand('copy');

    img.parentNode.removeChild(img);
  };
}


var screenshot;

function capture(data, sender, callback) {

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

  screenshot.ratio  = data.ratio;
  screenshot.width  = data.totalWidth;
  screenshot.height = data.totalHeight;

  if (!screenshot.canvas) {
    var canvas = document.createElement('canvas');

    canvas.width  = data.totalWidth;
    canvas.height = data.totalHeight;

    screenshot.canvas = canvas;
    screenshot.ctx    = canvas.getContext('2d');
  }


  chrome.tabs.get(sender.tab.id, function (tab) {
    chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    }, function (dataUrl) {

      if (dataUrl) {

        var img = new Image();

        img.onload = function () {
          screenshot.ctx.drawImage(img,
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
}

function save(callback) {
  // standard dataURI can be too big, let's blob instead
  // http://code.google.com/p/chromium/issues/detail?id=69227#c27
  var dataURI = screenshot.canvas.toDataURL('image/png');

  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // create a blob for writing to a file
  var blob = new Blob([ab], { type: mimeString });

  // come up with file-system size with a little buffer
  var size = blob.size + (1024 / 2);
  var name = new Date().getTime() + '.png';


  function onWriteEnd() {
    screenshot.name = name;
    screenshot.path = 'filesystem:chrome-extension://' + chrome.runtime.id + '/temporary/' + name;
    callback && callback();
  }

  function onError() { }

  // create a blob for writing to a file
  window.webkitRequestFileSystem(window.TEMPORARY, size, function (fs) {
    fs.root.getFile(name, { create: true }, function (fileEntry) {
      fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = onWriteEnd;
        fileWriter.write(blob);
      }, onError);
    }, onError);
  }, onError);
}


chrome.pageAction.onClicked.addListener(function onClicked(tab) {

  screenshot = window.screenshot = {};

  chrome.tabs.sendMessage(tab.id, { action: 'start' }, function () {
    save(function () {

      chrome.tabs.create({
        url: chrome.extension.getURL('editor.html'),
        windowId: tab.windowId
      });
    });
  });
});

chrome.runtime.onMessage.addListener(function (message, sender, callback) {

  if (!sender || sender.id !== chrome.runtime.id || !sender.tab) {
    return;
  }

  var action = message && message.action;

  if (action === 'enable') {
    chrome.pageAction.show(sender.tab.id);
  } else if (action === 'capture') {
    capture(message, sender, callback);

    // This callback function becomes invalid when the event listener returns,
    // unless you return true from the event listener to indicate you wish to
    // send a response asynchronously (this will keep the message channel open
    // to the other end until sendResponse is called).
    return true;
  }
});
