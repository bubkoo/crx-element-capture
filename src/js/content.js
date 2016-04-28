'use strict';

// received message from background
chrome.extension.onMessage.addListener(function (message) {
  if (message.action === 'start') {
    start();
  }
});

// send message to background
function send(message) {
  chrome.extension.sendMessage(message);
}

var strokeWidth = 2;
var styleNode;
var overlay;
var outline;

function start() {

  if (!styleNode) {
    styleNode = document.createElement('style');

    styleNode.type = 'text/css';

    var css = '@keyframes ant-line { to { stroke-dashoffset: 100000; } }';

    if (styleNode.styleSheet) {
      styleNode.styleSheet.cssText = css;
    } else {
      styleNode.appendChild(document.createTextNode(css));
    }
  }

  if (!styleNode.parentNode) {
    var head = document.head || document.getElementsByTagName('head')[0];

    if (head) {
      head.appendChild(styleNode);
    }
  }

  if (!overlay) {

    overlay = document.createElement('div');

    overlay.style.position      = 'absolute';
    overlay.style.top           = '0';
    overlay.style.left          = '0';
    overlay.style.width         = '100%';
    overlay.style.height        = '100%';
    overlay.style.pointerEvents = 'none';


    outline = document.createElement('div');

    outline.style.position = 'fixed';
    outline.style.zIndex   = '99999';

    overlay.appendChild(outline);
  }

  if (!overlay.parentNode) {
    document.body.appendChild(overlay);
    document.body.addEventListener('mousemove', mousemove, false);
    document.body.addEventListener('mousedown', mousedown, false);
    document.body.addEventListener('keydown', keydown, false);
  }


  var element;
  var metadata = {};

  function mousemove(e) {
    if (element !== e.target) {

      element  = e.target;
      metadata = getBounds(element);

      var pathData = 'M' + strokeWidth / 2 + ' ' + strokeWidth / 2
        + 'H' + (metadata.width + strokeWidth)
        + 'V' + (metadata.height + strokeWidth)
        + 'H' + strokeWidth / 2
        + 'V' + strokeWidth / 2;

      var html = '' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewport="0 0 {width} {height}" style="border: 0;">' +
        '  <path fill="rgba(48,132,242,.2)" ' +
        '        stroke="rgb(217,35,68)" ' +
        '        stroke-width="{strokeWidth}" ' +
        '        stroke-dasharray="7" ' +
        '        style="animation: ant-line 1500s infinite linear; animation-delay: .3s; "' +
        '        d="{d}"></path>' +
        '</svg>';

      html = html
        .replace('{d}', pathData)
        .replace(/\{width\}/g, metadata.width + 2 * strokeWidth)
        .replace(/\{height\}/g, metadata.height + 2 * strokeWidth)
        .replace('{strokeWidth}', strokeWidth);

      outline.style.top    = (metadata.top - strokeWidth) + 'px';
      outline.style.left   = (metadata.left - strokeWidth) + 'px';
      outline.style.width  = (metadata.width + 2 * strokeWidth) + 'px';
      outline.style.height = (metadata.height + 2 * strokeWidth) + 'px';

      outline.innerHTML = html;
    }
  }

  function mousedown() {
    clean();
    capture();
  }

  function keydown(e) {
    if (e.keyCode === 13) {
      // enter
      clean();
      capture();
    } else if (e.keyCode === 27) {
      // esc
      clean();
    }
  }

  function clean() {

    overlay.parentNode.removeChild(overlay);
    styleNode.parentNode.removeChild(styleNode);

    outline.innerHTML    = '';
    outline.style.top    = '0px';
    outline.style.left   = '0px';
    outline.style.width  = '0px';
    outline.style.height = '0px';

    document.body.removeEventListener('mousemove', mousemove, false);
    document.body.removeEventListener('mousedown', mousedown, false);
    document.body.removeEventListener('keydown', keydown, false);
  }

  function capture() {
    metadata.ratio = window.devicePixelRatio;
    setTimeout(function () {
      send({
        action: 'capture',
        metadata: metadata
      });
    }, 100);
  }
}


function getBounds(el) {

  var doc;

  if (el === document) {
    doc = document;
    el  = document.documentElement;
  } else {
    doc = el.ownerDocument;
  }

  var docEl = doc.documentElement;

  var box = {};
  // The original object returned by getBoundingClientRect is immutable,
  // so we clone it.
  var rect = el.getBoundingClientRect();
  for (var k in rect) {
    box[k] = rect[k];
  }

  //const origin = getOrigin(doc);
  //
  //box.top -= origin.top;
  //box.left -= origin.left;

  if (typeof box.width === 'undefined') {
    box.width = document.body.scrollWidth - box.left - box.right;
  }
  if (typeof box.height === 'undefined') {
    box.height = document.body.scrollHeight - box.top - box.bottom;
  }

  box.top    = box.top - docEl.clientTop;
  box.left   = box.left - docEl.clientLeft;
  box.right  = doc.body.clientWidth - box.width - box.left;
  box.bottom = doc.body.clientHeight - box.height - box.top;

  return box;
}


// page prepared, then enable this capture button
send({ action: 'enable' });
