'use strict';

// send message to tabs
chrome.pageAction.onClicked.addListener(function onClicked(tab) {
  chrome.tabs.sendMessage(tab.id, { action: 'start' });
});

// received message from tabPage
chrome.extension.onMessage.addListener(function (message, sender) {

  // page prepared, then enable the capture button
  if (message.action === 'enable') {

    chrome.pageAction.show(sender.tab.id);

  } else if (message.action === 'capture') {

    var metadata = message.metadata;

    // Get window.devicePixelRatio from the page, not the popup
    var scale = metadata.ratio && metadata.ratio !== 1
      ? 1 / metadata.ratio
      : 1;

    metadata.name = (new Date()).getTime();

    // if the canvas is scaled, then x- and y-positions have to make up for it
    if (scale !== 1) {
      metadata.top    = metadata.top / scale;
      metadata.left   = metadata.left / scale;
      metadata.width  = metadata.width / scale;
      metadata.height = metadata.height / scale;

      metadata.name += '@' + metadata.ratio + 'x';
    }

    capture(sender.tab.id, metadata);
  }
});


var canvas = null;

function capture(tabId, metadata) {

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
