'use strict';

var overlay;
var outline;
var styleNode;
var strokeWidth = 2;

var delay = 150;

var element;
var metadata;
var onFinish;


// event handler
// -------------

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

  var docSize = getDocumentSize(document);

  overlay.style.width  = docSize.width + 'px';
  overlay.style.height = docSize.height + 'px';

  if (!overlay.parentNode) {

    var body = document.body;

    body.appendChild(overlay);
    body.addEventListener('mousemove', highlight, false);
    body.addEventListener('mousedown', capture, false);
    body.addEventListener('keydown', shortcut, false);
  }

  onFinish = function () {
    callback && callback();

    element  = null;
    metadata = null;
    onFinish = null;
  };
}

function highlight(e) {

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
      .replace('{strokeWidth}', '' + strokeWidth);

    outline.style.top    = (document.body.scrollTop + metadata.top - strokeWidth) + 'px';
    outline.style.left   = (document.body.scrollLeft + metadata.left - strokeWidth) + 'px';
    outline.style.width  = (metadata.width + 2 * strokeWidth) + 'px';
    outline.style.height = (metadata.height + 2 * strokeWidth) + 'px';

    outline.innerHTML = html;
  }
}

function unHighlight() {
  overlay.parentNode.removeChild(overlay);
  styleNode.parentNode.removeChild(styleNode);

  outline.innerHTML    = '';
  outline.style.top    = '0px';
  outline.style.left   = '0px';
  outline.style.width  = '0px';
  outline.style.height = '0px';

  var body = document.body;

  body.removeEventListener('mousemove', highlight, false);
  body.removeEventListener('mousedown', capture, false);
  body.removeEventListener('keydown', shortcut, false);
}

function shortcut(e) {
  if (e.keyCode === 13) {
    // enter
    capture();
  } else if (e.keyCode === 27) {
    // esc
    unHighlight();
  }
}

function capture() {

  unHighlight();

  var parent = getScrollParent(element);

  isOverflow(parent)
    ? overflowCapture(parent)
    : normalCapture();
}

function overflowCapture(parent) {
  // save parent's status
  var overflow = parent.style.overflow;
  var originX  = parent.scrollLeft;
  var originY  = parent.scrollTop;

  var eBound;

  // disable all scrollBars, restore it when captured
  parent.style.overflow = 'hidden';

  // try to scroll element to top-left corner of the viewport
  if (isBody(parent)) {

    eBound = getBounds(element);

    parent.scrollLeft += eBound.left;
    parent.scrollTop += eBound.top;
  } else {

    var offset = getRelativePosition(element, parent);

    parent.scrollLeft = offset.left;
    parent.scrollTop  = offset.top;
  }

  eBound = getBounds(element);

  var startX = parent.scrollLeft;
  var startY = parent.scrollTop;


  // the screen capture size
  var fullWidth;
  var fullHeight;

  if (isBody(element)) {
    var docSize = getDocumentSize(element.ownerDocument);
    fullWidth   = docSize.width;
    fullHeight  = docSize.height;
  } else {
    fullWidth  = max([element.offsetWidth, element.clientWidth]);
    fullHeight = max([element.offsetHeight, element.clientHeight]);
  }

  // viewport size
  var vSize  = getViewportSize(parent);
  var xDelta = vSize.width;
  var yDelta = vSize.height;

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
      onFinish && onFinish();
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

function normalCapture() {
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
    captured && onFinish && onFinish();
  });
}


// helpers
// -------

function isOverflow(parent) {

  // parent is body
  if (isBody(parent)) {

    if (metadata.left < 0 || metadata.top < 0) {
      return true;
    }

    var vSize = getViewportSize(parent);

    if (element === element.ownerDocument.body) {
      return element.scrollWidth > vSize.width
        || element.scrollHeight > vSize.height;
    }

    return metadata.left + metadata.width > vSize.width
      || metadata.top + metadata.height > vSize.height;
  }

  if (metadata.width > parent.clientWidth
    || metadata.height > parent.clientHeight) {
    return true;
  }
}

function isBody(ele) {
  return ele === element.ownerDocument.body;
}

function max(numbers) {
  return Math.max.apply(Math, numbers.filter(function (x) { return x; }));
}

function getDocumentSize(doc) {
  var body   = doc.body;
  var docEle = doc.documentElement;

  return {
    width: max([
      body.scrollWidth,
      body.offsetWidth,
      docEle.clientWidth,
      docEle.scrollWidth,
      docEle.offsetWidth
    ]),
    height: max([
      body.scrollHeight,
      body.offsetHeight,
      docEle.clientHeight,
      docEle.scrollHeight,
      docEle.offsetHeight
    ])
  }
}

function getViewportSize(ele) {

  ele = isBody(ele) ? ele.ownerDocument.documentElement : ele;

  return {
    width: ele.clientWidth,
    height: ele.clientHeight
  }
}

function getRelativePosition(ele, container) {
  var left = 0;
  var top  = 0;

  var computedStyle    = getComputedStyle(container);
  var computedPosition = computedStyle.getPropertyValue('position');
  var inlinePosition   = '';

  if (computedPosition === 'static') {
    inlinePosition = container.style.position;

    container.style.position = 'relative';
  }

  while (ele && ele !== container) {
    left += ele.offsetLeft;
    top += ele.offsetTop;

    ele = ele.offsetParent;
  }

  container.style.position = inlinePosition;

  return {
    left: left,
    top: top
  };
}

function getBounds(ele) {

  var doc;

  if (ele === document) {
    doc = document;
    ele = document.documentElement;
  } else {
    doc = ele.ownerDocument;
  }

  var docEle = doc.documentElement;

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

  box.top    = box.top - docEle.clientTop;
  box.left   = box.left - docEle.clientLeft;
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


// message
// -------

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

// page prepared, then enable this capture button
chrome.runtime.sendMessage({ action: 'enable' });
