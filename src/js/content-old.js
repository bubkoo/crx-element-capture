'use strict';

// received message from background
chrome.runtime.onMessage.addListener(function (message, sender, callback) {

  if (!sender || sender.id !== chrome.runtime.id) {
    return;
  }

  if (message.action === 'start') {
    start(callback);
  }

  return true;
});


var strokeWidth = 2;
var styleNode;
var overlay;
var outline;

var delay = 150;

var element;
var metadata = {};


function start(callback) {

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

  // event handler
  // -------------

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
    setTimeout(capture, delay);
  }

  function keydown(e) {
    if (e.keyCode === 13) {
      // enter
      mousedown();
    } else if (e.keyCode === 27) {
      // esc
      clean();
    }
  }

  function capture() {
    if (hasScrollBar(element)) {
      return captureScroll();
    } else {
      var parent = getScrollParent(element);
      var bound  = getBounds(parent);
      if (metadata.width > bound.width || metadata.height > bound.height) {
        return captureScroll(parent, bound);
      }
    }

    //metadata.ratio = window.devicePixelRatio;
    //setTimeout(function () {
    //  send({
    //    action: 'capture',
    //    metadata: metadata
    //  });
    //}, 100);
  }

  function captureScroll(parent, bound) {

    function cleanUp() {
      scrollEle.style.overflow = overflow;
      scrollEle.scrollLeft     = originalX;
      scrollEle.scrollTop      = originalY;
    }

    var scrollEle = parent || element;
    var overflow  = scrollEle.style.overflow;

    var originalX = scrollEle.scrollLeft;
    var originalY = scrollEle.scrollTop;

    var fullWidth  = parent ? element.offsetWidth : element.scrollWidth;
    var fullHeight = parent ? element.offsetHeight : element.scrollHeight;

    var xPad = 0;
    var yPad = 0;

    if (!parent) {
      xPad = element.offsetWidth - element.clientWidth;
      yPad = element.offsetHeight - element.clientHeight;
    }

    var xDelta;
    var yDelta;

    if (parent) {
      xDelta = parent.clientWidth + bound.left - metadata.left;
      yDelta = parent.clientHeight + bound.top - metadata.top;
    } else {
      xDelta = element.clientWidth;
      yDelta = element.clientHeight;
    }

    // collect the capture blocks
    var xPos = 0;
    var yPos = fullHeight - yDelta;

    var blocks = [];

    while (yPos > -yDelta) {
      xPos = 0;
      while (xPos < fullWidth) {
        blocks.push([xPos, yPos]);
        xPos += xPos === 0 && xPad > 0 ? xPad : xDelta;
      }
      yPos -= yDelta;
    }

    // left top position of the source image
    var sx;
    var sy;

    if (parent) {
      sx = metadata.left;
      sy = metadata.top;
    } else {
      sx = metadata.left + element.offsetWidth - element.clientWidth;
      sy = metadata.top + element.offsetHeight - element.clientHeight;
    }

    // disable all scrollBars, restore it when captured.
    scrollEle.style.overflow = 'hidden';

    (function process() {
      if (!blocks.length) {
        cleanUp();
        callback && callback();
        return;
      }

      var next = blocks.shift();

      var x = next[0];
      var y = next[1];

      scrollEle.scrollLeft = x;
      scrollEle.scrollTop  = y;

      var data = {
        action: 'capture',
        sx: sx,
        sy: sy,
        dx: scrollEle.scrollLeft,
        dy: scrollEle.scrollTop,
        width: xDelta,
        height: yDelta,
        totalWidth: fullWidth,
        totalHeight: fullHeight,
        ratio: window.devicePixelRatio
      };

      // need to wait for things to settle
      window.setTimeout(function () {
        // in case the below callback never returns, cleanup
        var timer = window.setTimeout(cleanUp, 1250);

        chrome.runtime.sendMessage(data, function (captured) {
          console.log(chrome.runtime.lastError);
          console.log(captured);
          console.log(data);

          window.clearTimeout(timer);
          if (captured) {
            process();
          } else {
            cleanUp();
          }
        });
      }, delay);
    })();
  }
}


// helpers
// -------

function getBounds(ele) {

  var doc;

  if (ele === document) {
    doc = document;
    ele = document.documentElement;
  } else {
    doc = ele.ownerDocument;
  }

  var docEl = doc.documentElement;

  var box = {};
  // The original object returned by getBoundingClientRect is immutable,
  // so we clone it.
  var rect = ele.getBoundingClientRect();
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

function getScrollParent(ele) {
  // In firefox if the el is inside an iframe with display: none;
  // window.getComputedStyle() will return null;
  // https://bugzilla.mozilla.org/show_bug.cgi?id=548397

  var computedStyle = getComputedStyle(ele) || {};
  var position      = computedStyle.position;

  if (position === 'fixed') {
    return ele;
  }

  var parent = ele;

  while (parent = parent.parentNode) {
    var style;
    try {
      style = getComputedStyle(parent);
    } catch (err) {}

    if (typeof style === 'undefined' || style === null) {
      return parent;
    }

    var overflow  = style.overflow;
    var overflowX = style.overflowX;
    var overflowY = style.overflowY;

    if (/(auto|scroll)/.test(overflow + overflowY + overflowX)) {
      if (position !== 'absolute' || ['relative', 'absolute', 'fixed'].indexOf(style.position) >= 0) {
        return parent;
      }
    }
  }

  return document.body;
}

function hasScrollBar(ele) {
  return ele.scrollHeight > ele.clientHeight || ele.offsetHeight > ele.clientHeight
    || ele.scrollWidth > ele.clientWidth || ele.offsetWidth > ele.clientWidth;
}

// page prepared, then enable this capture button
chrome.runtime.sendMessage({ action: 'enable' });
