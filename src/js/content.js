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

    overlay.style.pointerEvents = 'none';
    overlay.style.position      = 'absolute';
    overlay.style.left          = '0';
    overlay.style.top           = '0';

    outline = document.createElement('div');

    outline.style.position = 'absolute';
    outline.style.zIndex   = '99999';

    overlay.appendChild(outline);
  }

  overlay.style.width  = document.body.scrollWidth + 'px';
  overlay.style.height = document.body.scrollHeight + 'px';

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

      outline.style.top    = (document.body.scrollTop + metadata.top - strokeWidth) + 'px';
      outline.style.left   = (document.body.scrollLeft + metadata.left - strokeWidth) + 'px';
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
    var parent = getScrollParent(element);
    var isBody = parent === element.ownerDocument.body;

    if (needScroll(parent, isBody)) {
      return isBody
        ? scrollBody(parent)
        : scrollElement(parent)
    }

    chrome.runtime.sendMessage({
      action: 'capture',
      sx: metadata.left,
      sy: metadata.top,
      dx: 0,
      dy: 0,
      width: metadata.width,
      height: metadata.height,
      totalWidth: metadata.width,
      totalHeight: metadata.height,
      ratio: window.devicePixelRatio
    }, function (captured) {
      if (captured) {
        callback && callback();
      }
    });
  }

  function needScroll(parent, isBody) {

    // parent is body
    if (isBody) {
      if (metadata.left < 0 || metadata.top < 0) {
        return true;
      }

      var docEle  = element.ownerDocument.documentElement;
      var vWidth  = docEle.clientWidth;
      var vHeight = docEle.clientHeight;

      if (element === element.ownerDocument.body) {
        return element.scrollWidth > vWidth || element.scrollHeight > vHeight;
      }

      return metadata.left + metadata.width > vWidth || metadata.top + metadata.height > vHeight;
    }

    if (metadata.width > parent.clientWidth
      || metadata.height > parent.clientHeight) {
      return true;
    }
  }

  function scrollBody(parent) {
    var docEle = element.ownerDocument.documentElement;

    // save parent's status
    var overflow = parent.style.overflow;
    var originX  = parent.scrollLeft;
    var originY  = parent.scrollTop;
    var eBound   = getBounds(element);

    // disable all scrollBars, restore it when captured
    parent.style.overflow = 'hidden';
    // try to scroll element to top-left corner of the viewport
    parent.scrollLeft = parent.scrollLeft + eBound.left;
    parent.scrollTop  = parent.scrollTop + eBound.top;

    var startX = parent.scrollLeft;
    var startY = parent.scrollTop;

    eBound = getBounds(element);

    // the screen capture size
    var fullWidth  = element.scrollWidth || element.offsetWidth;
    var fullHeight = element.scrollHeight || element.offsetHeight;

    // viewport size
    var xDelta = docEle.clientWidth;
    var yDelta = docEle.clientHeight;

    // collect the capture blocks
    var xPos = 0;
    var yPos = 0;

    var blocks = [];

    while (yPos < fullHeight) {
      xPos = 0;
      while (xPos < fullWidth) {

        var block = {
          dx: xPos,
          dy: yPos,
          width: Math.min(xDelta, fullWidth - xPos),
          height: Math.min(yDelta, fullHeight - yPos)
        };

        block.sx = fullWidth > xDelta && xPos + xDelta > fullWidth
          ? eBound.left + xPos + xDelta - fullWidth
          : eBound.left;

        block.sy = fullHeight > yDelta && yPos + yDelta > fullHeight
          ? eBound.top + yPos + yDelta - fullHeight
          : eBound.top;

        blocks.push(block);

        xPos += xDelta;
      }
      yPos += yDelta;
    }

    function reset() {
      parent.style.overflow = overflow;
      parent.scrollLeft     = originX;
      parent.scrollTop      = originY;
    }

    (function process() {
      if (!blocks.length) {
        reset();
        callback && callback();
        return;
      }

      var next = blocks.shift();

      parent.scrollLeft = next.dx + startX;
      parent.scrollTop  = next.dy + startY;

      next.action      = 'capture';
      next.ratio       = window.devicePixelRatio;
      next.totalWidth  = fullWidth;
      next.totalHeight = fullHeight;

      // need to wait for things to settle
      window.setTimeout(function () {
        // in case the below callback never returns, cleanup
        var timer = window.setTimeout(reset, 1250);

        chrome.runtime.sendMessage(next, function (captured) {

          window.clearTimeout(timer);

          if (captured) {
            process();
          } else {
            reset();
          }
        });
      }, delay);

    })();
  }

  function scrollElement(parent) {

    var pBound = getBounds(parent);

    var fullWidth  = element.offsetWidth;
    var fullHeight = element.offsetHeight;

    var xDelta = parent.clientWidth + pBound.left - metadata.left;
    var yDelta = parent.clientHeight + pBound.top - metadata.top;

    // collect the capture blocks
    var xPos = 0;
    var yPos = fullHeight - yDelta;

    var blocks = [];

    while (yPos + yDelta > 0) {
      xPos = 0;
      while (xPos < fullWidth) {
        blocks.push([xPos, yPos]);
        xPos += xDelta;
      }
      yPos -= yDelta;
    }

    // save parent's status
    var overflow  = parent.style.overflow;
    var originalX = parent.scrollLeft;
    var originalY = parent.scrollTop;

    // disable all scrollBars, restore it when captured.
    parent.style.overflow = 'hidden';

    function reset() {
      parent.style.overflow = overflow;
      parent.scrollLeft     = originalX;
      parent.scrollTop      = originalY;
    }

    (function process() {
      if (!blocks.length) {
        reset();
        callback && callback();
        return;
      }

      var next = blocks.shift();

      parent.scrollLeft = next[0];
      parent.scrollTop  = next[1];

      var data = {
        action: 'capture',
        sx: metadata.left,
        sy: metadata.top,
        dx: parent.scrollLeft,
        dy: parent.scrollTop,
        width: metadata.width,
        height: metadata.height,
        totalWidth: fullWidth,
        totalHeight: fullHeight,
        ratio: window.devicePixelRatio
      };

      // need to wait for things to settle
      window.setTimeout(function () {
        // in case the below callback never returns, cleanup
        var timer = window.setTimeout(reset, 1250);

        chrome.runtime.sendMessage(data, function (captured) {

          window.clearTimeout(timer);

          if (captured) {
            process();
          } else {
            reset();
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

// page prepared, then enable this capture button
chrome.runtime.sendMessage({ action: 'enable' });
