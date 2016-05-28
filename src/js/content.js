'use strict';


var antLine = {

  styleNode: null,
  fillColor: 'rgba(48,132,242,.2)',
  strokeColor: '#ff2f6c',
  strokeWidth: 1,
  dasharray: 4,

  ensureStyle: function () {

    var styleNode = antLine.styleNode;

    if (!styleNode) {

      styleNode = utils.createElement('style');

      styleNode.type    = 'text/css';
      antLine.styleNode = styleNode;

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
  },

  clearStyle: function () {
    utils.removeElement(antLine.styleNode);
  },

  create: function (fWidth, fHeight, tWidth, tHeight, expand, filled) {

    var sw = antLine.strokeWidth;

    var width  = Math.min(fWidth, expand ? tWidth + 2 * sw : tWidth);
    var height = Math.min(fHeight, expand ? tHeight + 2 * sw : tHeight);

    var xx = sw / 2;
    var yy = sw / 2;
    var hw = Math.min(fWidth, expand ? tWidth + sw : tWidth - xx);
    var vh = Math.min(fHeight, expand ? tHeight + sw : tHeight - yy);

    if (hw === fWidth) {
      hw = fWidth - xx;
    }

    if (vh === fHeight) {
      vh = fHeight - yy;
    }

    var pathData = 'M' + xx + ' ' + yy
      + 'H' + hw
      + 'V' + vh
      + 'H' + xx
      + 'V' + yy;

    var template = '' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewport="0 0 {width} {height}" style="position: absolute; left: 0; top: 0; border: 0; padding: 0; margin: 0">' +
      '  <path fill="{fillColor}" ' +
      '        stroke="{strokeColor}" ' +
      '        stroke-width="{strokeWidth}" ' +
      '        stroke-dasharray="{dasharray}" ' +
      '        style="animation: ant-line 2000s infinite linear; animation-delay: .3s; "' +
      '        d="{d}"></path>' +
      '</svg>';

    return template
      .replace('{d}', pathData)
      .replace(/\{width\}/g, '' + width)
      .replace(/\{height\}/g, '' + height)
      .replace('{fillColor}', filled ? antLine.fillColor : 'none')
      .replace('{dasharray}', '' + antLine.dasharray)
      .replace('{strokeColor}', '' + antLine.strokeColor)
      .replace('{strokeWidth}', '' + antLine.strokeWidth);
  }
};

var captureElement = {

  docWidth: 0,
  docHeight: 0,
  targetElem: null,
  overlayElem: null,
  outlineElem: null,

  start: function () {

    antLine.ensureStyle();
    captureElement.ensureOverlay();
    captureElement.bindEvents();
  },

  clear: function () {

    antLine.clearStyle();
    captureElement.removeOverlay();
    captureElement.unBindEvents();
    captureElement.targetElem = null;
  },

  ensureOverlay: function () {

    var overlayElem = captureElement.overlayElem;
    if (!overlayElem) {

      overlayElem = utils.createDiv();

      utils.setStyle(overlayElem, {
        pointerEvents: 'none',
        position: 'absolute',
        left: '0px',
        top: '0px'
      });

      captureElement.overlayElem = overlayElem;
      captureElement.outlineElem = utils.createDiv();

      utils.setStyle(captureElement.outlineElem, 'position', 'absolute');
      utils.setZIndex(captureElement.outlineElem);

      overlayElem.appendChild(captureElement.outlineElem);
    }

    if (!overlayElem.parentNode) {
      document.body.appendChild(overlayElem);
    }

    captureElement.onWindowResize();
  },

  removeOverlay: function () {

    utils.removeElement(captureElement.overlayElem);

    var outlineElem = captureElement.outlineElem;
    if (outlineElem) {
      utils.setProp(outlineElem, 'innerHTML', '');
      utils.setStyle(outlineElem, {
        left: '0px',
        top: '0px',
        width: '0px',
        height: '0px'
      });
    }
  },

  bindEvents: function () {

    document.body.addEventListener('mousemove', captureElement.onMouseMove, false);
    document.body.addEventListener('mousedown', captureElement.onMouseDown, false);
    document.body.addEventListener('keydown', captureElement.onKeyDown, false);

    window.addEventListener('resize', captureElement.onWindowResize, false);
  },

  unBindEvents: function () {

    document.body.removeEventListener('mousemove', captureElement.onMouseMove, false);
    document.body.removeEventListener('mousedown', captureElement.onMouseDown, false);
    document.body.removeEventListener('keydown', captureElement.onKeyDown, false);

    window.removeEventListener('resize', captureElement.onWindowResize, false);
  },

  onWindowResize: function () {

    var docSize = utils.getDocumentSize();

    captureElement.docWidth  = docSize.width;
    captureElement.docHeight = docSize.height;

    utils.setStyle(captureElement.overlayElem, {
      width: captureElement.docWidth + 'px',
      height: captureElement.docHeight + 'px'
    });
  },

  onMouseMove: function updateTarget(e) {

    if (captureElement.targetElem !== e.target) {

      captureElement.targetElem = e.target;

      var sw        = antLine.strokeWidth;
      var bounds    = utils.getBounds(e.target);
      var docWidth  = captureElement.docWidth;
      var docHeight = captureElement.docHeight;

      utils.setStyle(captureElement.outlineElem, {
        top: Math.max(document.body.scrollTop + bounds.top - sw, 0) + 'px',
        left: Math.max(document.body.scrollLeft + bounds.left - sw, 0) + 'px',
        width: Math.min(docWidth, bounds.width + 2 * sw) + 'px',
        height: Math.min(docHeight, bounds.height + 2 * sw) + 'px'
      });

      utils.setProp(captureElement.outlineElem, {
        innerHTML: antLine.create(docWidth, docHeight, bounds.width, bounds.height, true, true)
      });
    }
  },

  onMouseDown: function doCapture() {

    worker.start(captureElement.targetElem);
    captureElement.clear();
  },

  onKeyDown: function onShortCut(e) {

    switch (e.keyCode) {

      case 13: // enter
        captureElement.onMouseDown();
        break;

      case 27: // esc
        captureElement.clear();
        break;

      default:
        break;
    }
  }
};

var captureRegion = {

  docWidth: 0,
  docHeight: 0,

  start: function () {

    captureRegion.ensureCropElements();

    window.addEventListener('resize', captureRegion.onWindowResize, false);
    document.body.addEventListener('keydown', captureRegion.onKeyDown, false);

    captureRegion.bindCrossLine();
    captureRegion.onWindowResize();
  },

  clear: function () {

    captureRegion.clearCrossLine();
    captureRegion.clearController();
    captureRegion.clearCrop();

    antLine.clearStyle();

    window.removeEventListener('resize', captureRegion.onWindowResize, false);
    document.body.removeEventListener('keydown', captureRegion.onKeyDown, false);
  },

  captureCrop: function () {

    worker.start(captureRegion.cropCenterElem)
    captureRegion.clear();
  },

  onWindowResize: function () {

    var dSize = utils.getDocumentSize();

    captureRegion.docWidth  = dSize.width;
    captureRegion.docHeight = dSize.height;

    utils.setStyle(captureRegion.cropWrapElem, {
      width: dSize.width + 'px',
      height: dSize.height + 'px'
    });

    captureRegion.updateCropElements();
  },

  onKeyDown: function (e) {

    switch (e.keyCode) {

      case 13: // enter

        var bounds = captureRegion.getCropBounds();
        if (bounds.width > 0 && bounds.height > 0) {

          captureRegion.captureCrop();

        } else {

          var x = document.body.scrollLeft + document.documentElement.clientWidth / 2;
          var y = document.body.scrollTop + document.documentElement.clientHeight / 2;

          antLine.ensureStyle();

          captureRegion.createDemoCrop(x, y);
          captureRegion.clearCrossLine();
          captureRegion.bindCenter();
          captureRegion.bindController();
        }
        break;

      case 27: // esc
        captureRegion.clear();
        break;

      default:
        break;
    }
  },


  // crop elements
  // -------------

  cropWrapElem: null,
  cropTopElem: null,
  cropRightElem: null,
  cropBottomElem: null,
  cropLeftElem: null,
  cropCenterElem: null,
  cropAntLineElem: null,

  bgColor: 'rgba(0,0,0,0.5)',
  bgTransparent: 'rgba(0,0,0,0)',

  ensureCropElements: function () {

    var cropWrapElem = captureRegion.cropWrapElem;

    if (!cropWrapElem) {

      cropWrapElem = captureRegion.cropWrapElem = utils.createDiv();

      utils.setStyle(cropWrapElem, {
        position: 'absolute',
        left: 0,
        top: 0,
        cursor: 'crosshair',
        boxSizing: 'border-box',
        fontFamily: 'Helvetica, arial, sans-serif'
      });

      utils.setZIndex(cropWrapElem);


      var cropTopElem = captureRegion.cropTopElem = utils.createDiv();
      var cropRightElem = captureRegion.cropRightElem = utils.createDiv();
      var cropBottomElem = captureRegion.cropBottomElem = utils.createDiv();
      var cropLeftElem = captureRegion.cropLeftElem = utils.createDiv();
      var cropCenterElem = captureRegion.cropCenterElem = utils.createDiv();
      var cropAntLineElem = captureRegion.cropAntLineElem = utils.createDiv();

      [
        cropTopElem,
        cropRightElem,
        cropBottomElem,
        cropLeftElem,
        cropCenterElem
      ].forEach(function (elem) {
        utils.setStyle(elem, {
          position: 'absolute',
          cursor: 'auto',
          backgroundColor: captureRegion.bgColor
        })

        cropWrapElem.appendChild(elem);
      });

      utils.setStyle(cropTopElem, { top: 0, left: 0 });
      utils.setStyle(cropRightElem, { top: 0, right: 0 });
      utils.setStyle(cropBottomElem, { bottom: 0, right: 0 });
      utils.setStyle(cropLeftElem, { bottom: 0, left: 0 });

      utils.setStyle(cropCenterElem, {
        cursor: 'move',
        boxSizing: 'border-box',
        backgroundColor: captureRegion.bgTransparent
      });

      cropCenterElem.appendChild(cropAntLineElem);
    }

    if (!cropWrapElem.parentNode) {
      document.body.appendChild(cropWrapElem);
    }
  },

  updateCropElements: function (bounds) {

    var bounds = bounds || captureRegion.getCropBounds();

    var docWidth  = captureRegion.docWidth;
    var docHeight = captureRegion.docHeight;

    if (bounds.width > 0 && bounds.height > 0) {

      utils.setStyle(captureRegion.cropWrapElem, {
        backgroundColor: captureRegion.bgTransparent
      });

      utils.setStyle(captureRegion.cropTopElem, {
        width: bounds.left + bounds.width + 'px',
        height: bounds.top + 'px'
      });

      utils.setStyle(captureRegion.cropRightElem, {
        width: docWidth - bounds.left - bounds.width + 'px',
        height: bounds.top + bounds.height + 'px'
      });

      utils.setStyle(captureRegion.cropBottomElem, {
        width: docWidth - bounds.left + 'px',
        height: docHeight - bounds.top - bounds.height + 'px'
      });

      utils.setStyle(captureRegion.cropLeftElem, {
        width: bounds.left + 'px',
        height: docHeight - bounds.top + 'px'
      });

      utils.setStyle(captureRegion.cropCenterElem, {
        top: bounds.top + 'px',
        left: bounds.left + 'px',
        width: bounds.width + 'px',
        height: bounds.height + 'px'
      });

      captureRegion.cropAntLineElem.innerHTML = antLine.create(docWidth, docHeight, bounds.width, bounds.height, false, false);

      if (captureRegion.resizeWrap) {
        captureRegion.resizeWrap.style.display = '';
      }

    } else {

      utils.setStyle(captureRegion.cropWrapElem, {
        backgroundColor: captureRegion.bgColor
      });

      captureRegion.cropTopElem.style.width  = 0;
      captureRegion.cropTopElem.style.height = 0;

      captureRegion.cropRightElem.style.width  = 0;
      captureRegion.cropRightElem.style.height = 0;

      captureRegion.cropBottomElem.style.width  = 0;
      captureRegion.cropBottomElem.style.height = 0;

      captureRegion.cropLeftElem.style.width  = 0;
      captureRegion.cropLeftElem.style.height = 0;

      captureRegion.cropCenterElem.style.top    = 0;
      captureRegion.cropCenterElem.style.left   = 0;
      captureRegion.cropCenterElem.style.width  = 0;
      captureRegion.cropCenterElem.style.height = 0;

      captureRegion.cropAntLineElem.innerHTML = '';

      if (captureRegion.resizeWrap) {
        captureRegion.resizeWrap.style.display = 'none';
      }
    }
  },

  getCropBounds: function () {

    var cropCenterElem = captureRegion.cropCenterElem;

    return {
      top: parseInt(cropCenterElem.style.top, 10),
      left: parseInt(cropCenterElem.style.left, 10),
      width: cropCenterElem.offsetWidth || cropCenterElem.clientWidth,
      height: cropCenterElem.offsetHeight || cropCenterElem.clientHeight
    };
  },

  clearCrop: function () {

    utils.removeElement(captureRegion.cropWrapElem);

    captureRegion.updateCropElements({
      left: 0,
      top: 0,
      width: 0,
      height: 0
    });

    captureRegion.unBindCenter();
  },


  // cross line
  // ----------
  crossWrapElem: null,
  crossVElem: null,
  crossHElem: null,
  crossPosElem: null,
  crossColor: '#f0f0f0',

  ensureCrossLine: function () {

    var crossWrapElem = captureRegion.crossWrapElem;

    if (!crossWrapElem) {

      crossWrapElem = captureRegion.crossWrapElem = utils.createDiv();

      var crossPosElem = captureRegion.crossPosElem = utils.createDiv();
      var crossVElem = captureRegion.crossVElem = utils.createDiv();
      var crossHElem = captureRegion.crossHElem = utils.createDiv();

      utils.setStyle(crossVElem, {
        position: 'absolute',
        top: 0,
        bottom: 0,
        padding: 0,
        margin: 0,
        width: '1px',
        boxSizing: 'border-box',
        backgroundColor: captureRegion.crossColor
      });

      utils.setStyle(crossHElem, {
        position: 'absolute',
        left: 0,
        right: 0,
        padding: 0,
        margin: 0,
        height: '1px',
        boxSizing: 'border-box',
        backgroundColor: captureRegion.crossColor
      });

      utils.setStyle(crossPosElem, {
        position: 'absolute',
        fontSize: '12px',
        textAlign: 'center',
        boxSizing: 'border-box',
        padding: '0 10px',
        height: '26px',
        lineHeight: '26px',
        borderRadius: '13px',
        color: captureRegion.crossColor,
        backgroundColor: 'rgba(0,0,0,0.8)'
      });

      crossWrapElem.appendChild(crossVElem);
      crossWrapElem.appendChild(crossHElem);
      crossWrapElem.appendChild(crossPosElem);
    }

    if (!crossWrapElem.parentNode) {
      captureRegion.cropWrapElem.appendChild(crossWrapElem);
    }
  },

  clearCrossLine: function () {

    captureRegion.clearScrollTimer();

    captureRegion.crossVElem.style.left  = '-1px';
    captureRegion.crossHElem.style.top   = '-1px';
    captureRegion.crossPosElem.innerText = '';

    utils.removeElement(captureRegion.crossWrapElem);
    captureRegion.unBindCrossLine();
  },

  bindCrossLine: function () {

    document.body.addEventListener('mousemove', captureRegion.updateCrossLine, false);
    document.body.addEventListener('mousedown', captureRegion.onCropMouseDown, false);
  },

  unBindCrossLine: function () {

    document.body.removeEventListener('mousemove', captureRegion.updateCrossLine, false);
    document.body.removeEventListener('mousedown', captureRegion.onCropMouseDown, false);
  },

  updateCrossLine: function (e) {

    captureRegion.ensureCrossLine();
    captureRegion.clearScrollTimer();
    captureRegion.placeCrossLine(e.pageX, e.pageY);
    captureRegion.autoScrollCrossLine(e.pageX, e.pageY);
  },

  placeCrossLine: function (pageX, pageY) {

    captureRegion.crossVElem.style.left = Math.max(pageX - 1, 0) + 'px';
    captureRegion.crossHElem.style.top  = Math.max(pageY - 1, 0) + 'px';

    var crossPosElem = captureRegion.crossPosElem;

    crossPosElem.innerText = pageX + ' x ' + pageY;

    var body    = document.body;
    var docElem = document.documentElement;
    var cWidth  = crossPosElem.offsetWidth || crossPosElem.clientWidth;
    var cHeight = crossPosElem.offsetHeight || crossPosElem.clientHeight;

    var left = pageX + 10;
    var top  = pageY + 10;

    if (left + cWidth + 10 >= body.scrollLeft + docElem.clientWidth) {
      left = pageX - cWidth - 10;
    }

    if (top + cHeight + 10 >= body.scrollTop + docElem.clientHeight) {
      top = pageY - cHeight - 10;
    }

    crossPosElem.style.left = left + 'px';
    crossPosElem.style.top  = top + 'px';
  },

  autoScrollCrossLine: function (pageX, pageY) {

    if (utils.isBodyScrollable()) {

      var body    = document.body;
      var docElem = document.documentElement;

      var clientWidth  = docElem.clientWidth;
      var clientHeight = docElem.clientHeight;
      var scrollWidth  = docElem.scrollWidth;
      var scrollHeight = docElem.scrollHeight;

      var scrollTop  = body.scrollTop;
      var scrollLeft = body.scrollLeft;

      var scrollDist  = captureRegion.scrollDist;
      var scrollSense = captureRegion.scrollSense;

      var scrolled = false;

      if (scrollLeft > 0 && pageX > 0 && pageX - scrollSense <= scrollLeft) {

        scrolled = true;

        pageX      = Math.max(pageX - scrollDist, 0);
        scrollLeft = Math.max(0, scrollLeft - scrollDist);

      } else if (scrollLeft < scrollWidth - clientWidth
        && pageX < scrollWidth
        && pageX + scrollSense >= scrollLeft + clientWidth) {

        scrolled = true;

        pageX      = Math.min(pageX + scrollDist, scrollWidth);
        scrollLeft = Math.min(scrollWidth - clientWidth, scrollLeft + scrollDist);

      } else if (scrollTop > 0 && pageY - scrollSense <= scrollTop) {

        scrolled = true;

        pageY     = Math.max(pageY - scrollDist, 0);
        scrollTop = Math.max(0, scrollTop - scrollDist);

      } else if (scrollTop < scrollHeight - clientHeight
        && pageY < scrollHeight
        && pageY + scrollSense >= scrollTop + clientHeight) {

        scrolled = true;

        pageY     = Math.min(pageY + scrollDist, scrollHeight);
        scrollTop = Math.min(scrollHeight - clientHeight, scrollTop + scrollDist);
      }

      if (scrolled) {

        body.scrollLeft = scrollLeft;
        body.scrollTop  = scrollTop;

        captureRegion.placeCrossLine(pageX, pageY);
        captureRegion.setupScrollTimer(function () {
          captureRegion.autoScrollCrossLine(pageX, pageY);
        });
      }
    }
  },


  mouseDownTimer: 0,
  mouseDownDelay: 200,
  isMouseDown: false,
  clickCount: 0,

  setupMouseDownTimer: function (callback) {

    captureRegion.mouseDownTimer = setTimeout(callback, captureRegion.mouseDownDelay);
  },

  clearMouseDownTimer: function () {

    if (captureRegion.mouseDownTimer) {
      clearTimeout(captureRegion.mouseDownTimer);
      captureRegion.mouseDownTimer = 0;
    }
  },


  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,


  onCropMouseDown: function (e) {

    e.preventDefault();

    captureRegion.clearCrossLine();

    document.body.addEventListener('mousemove', captureRegion.onCropMouseMove, false);
    document.body.addEventListener('mouseup', captureRegion.onCropMouseUp, false);

    captureRegion.startX = e.pageX;
    captureRegion.startY = e.pageY;

    captureRegion.isMouseDown = false;

    captureRegion.setupMouseDownTimer(function () {
      captureRegion.isMouseDown = true;
    });
  },

  onCropMouseMove: function (e) {

    e.preventDefault();

    captureRegion.clearScrollTimer();
    captureRegion.clearMouseDownTimer();
    captureRegion.isMouseDown = true;

    var pageX  = e.pageX;
    var pageY  = e.pageY;
    var startX = captureRegion.startX;
    var startY = captureRegion.startY;

    captureRegion.updateCropElements({
      top: Math.min(pageY, startY),
      left: Math.min(pageX, startX),
      width: Math.abs(pageX - startX),
      height: Math.abs(pageY - startY),
    });

    captureRegion.autoScrollCrop(pageX, pageY);
  },

  onCropMouseUp: function (e) {

    captureRegion.clearScrollTimer();

    document.body.removeEventListener('mousemove', captureRegion.onCropMouseMove, false);
    document.body.removeEventListener('mouseup', captureRegion.onCropMouseUp, false);

    if (!captureRegion.isMouseDown) {
      captureRegion.clearMouseDownTimer();
      // create a crop when click
      captureRegion.createDemoCrop(e.pageX, e.pageY);
    }

    var bounds = captureRegion.getCropBounds();
    if (bounds.width && bounds.height) {
      antLine.ensureStyle();
      captureRegion.bindCenter();
      captureRegion.bindController();
    } else {
      captureRegion.bindCrossLine();
      captureRegion.updateCrossLine(e);
    }
  },

  autoScrollCrop: function (pageX, pageY) {

    if (utils.isBodyScrollable()) {

      var body    = document.body;
      var docElem = document.documentElement;

      var clientWidth  = docElem.clientWidth;
      var clientHeight = docElem.clientHeight;
      var scrollWidth  = docElem.scrollWidth;
      var scrollHeight = docElem.scrollHeight;

      var scrollTop  = body.scrollTop;
      var scrollLeft = body.scrollLeft;

      var scrolled = false;

      var bounds = captureRegion.getCropBounds();
      var top    = bounds.top;
      var left   = bounds.left;
      var width  = bounds.width;
      var height = bounds.height;

      var scrollDist  = captureRegion.scrollDist;
      var scrollSense = captureRegion.scrollSense;

      if (scrollLeft > 0 && pageX > 0 && pageX - scrollSense <= scrollLeft) {

        scrolled = true;

        pageX      = Math.max(pageX - scrollDist, 0);
        left       = Math.max(0, left - scrollDist);
        width      = width + bounds.left - left;
        scrollLeft = Math.max(0, scrollLeft - scrollDist);

      } else if (scrollLeft < scrollWidth - clientWidth
        && pageX < scrollWidth
        && pageX + scrollSense >= scrollLeft + clientWidth) {

        scrolled = true;

        pageX      = Math.min(pageX + scrollDist, scrollWidth);
        width      = Math.min(scrollWidth - left, width + scrollDist);
        scrollLeft = Math.min(scrollWidth - clientWidth, scrollLeft + scrollDist);

      } else if (scrollTop > 0 && pageY > 0 && pageY - scrollSense <= scrollTop) {

        scrolled = true;

        pageY     = Math.max(pageY - scrollDist, 0);
        top       = Math.max(0, top - scrollDist);
        height    = height + bounds.top - top;
        scrollTop = Math.max(0, scrollTop - scrollDist);

      } else if (scrollTop < scrollHeight - clientHeight
        && pageY < scrollHeight
        && pageY + scrollSense >= scrollTop + clientHeight) {

        scrolled = true;

        pageY     = Math.min(pageY + scrollDist, scrollHeight);
        height    = Math.min(scrollHeight - top, height + scrollDist);
        scrollTop = Math.min(scrollHeight - clientHeight, scrollTop + scrollDist);
      }

      if (scrolled) {

        body.scrollLeft = scrollLeft;
        body.scrollTop  = scrollTop;

        captureRegion.updateCropElements({
          top: top,
          left: left,
          width: width,
          height: height
        });

        captureRegion.setupScrollTimer(function () {
          captureRegion.autoScrollCrop(pageX, pageY);
        });
      }
    }
  },

  createDemoCrop: function (x, y) {

    var size = 200;

    var scrollLeft   = document.body.scrollLeft;
    var scrollTop    = document.body.scrollTop;
    var clientWidth  = document.documentElement.clientWidth;
    var clientHeight = document.documentElement.clientHeight;

    captureRegion.updateCropElements({
      top: utils.clamp(y - size / 2, scrollTop, scrollTop + clientHeight - size),
      left: utils.clamp(x - size / 2, scrollLeft, scrollLeft + clientWidth - size),
      width: size,
      height: size
    });
  },


  resizeWrap: null,
  btnResizeNW: null,
  btnResizeN: null,
  btnResizeNE: null,
  btnResizeW: null,
  btnResizeE: null,
  btnResizeSW: null,
  btnResizeS: null,
  btnResizeSE: null,
  btnResizeTop: null,
  btnResizeRight: null,
  btnResizeBottom: null,
  btnResizeLeft: null,

  btnResizeColor1: 'rgba(0,170,238,0.9)',
  btnResizeColor2: 'rgba(0,170,238,0.6)',

  handleNWMouseDown: null,
  handleNMouseDown: null,
  handleNEMouseDown: null,
  handleWMouseDown: null,
  handleEMouseDown: null,
  handleSWMouseDown: null,
  handleSMouseDown: null,
  handleSEMouseDown: null,

  ensureController: function () {

    var resizeWrap = captureRegion.resizeWrap;

    if (!resizeWrap) {

      resizeWrap = captureRegion.resizeWrap = utils.createDiv();

      var btnResizeNW = captureRegion.btnResizeNW = utils.createDiv();
      var btnResizeN = captureRegion.btnResizeN = utils.createDiv();
      var btnResizeNE = captureRegion.btnResizeNE = utils.createDiv();
      var btnResizeW = captureRegion.btnResizeW = utils.createDiv();
      var btnResizeE = captureRegion.btnResizeE = utils.createDiv();
      var btnResizeSW = captureRegion.btnResizeSW = utils.createDiv();
      var btnResizeS = captureRegion.btnResizeS = utils.createDiv();
      var btnResizeSE = captureRegion.btnResizeSE = utils.createDiv();
      var btnResizeTop = captureRegion.btnResizeTop = utils.createDiv();
      var btnResizeRight = captureRegion.btnResizeRight = utils.createDiv();
      var btnResizeBottom = captureRegion.btnResizeBottom = utils.createDiv();
      var btnResizeLeft = captureRegion.btnResizeLeft = utils.createDiv();

      [
        btnResizeTop,
        btnResizeRight,
        btnResizeBottom,
        btnResizeLeft
      ].forEach(function (elem) {
        elem.style.position = 'absolute';
        resizeWrap.appendChild(elem);
      });

      btnResizeTop.style.left   = 0;
      btnResizeTop.style.right  = 0;
      btnResizeTop.style.top    = '-5px';
      btnResizeTop.style.height = '11px';

      btnResizeRight.style.top    = 0;
      btnResizeRight.style.bottom = 0;
      btnResizeRight.style.right  = '-5px';
      btnResizeRight.style.width  = '11px';

      btnResizeBottom.style.left   = 0;
      btnResizeBottom.style.right  = 0;
      btnResizeBottom.style.bottom = '-5px';
      btnResizeBottom.style.height = '11px';

      btnResizeLeft.style.top    = 0;
      btnResizeLeft.style.bottom = 0;
      btnResizeLeft.style.left   = '-5px';
      btnResizeLeft.style.width  = '11px';

      var innerElem = document.createElement('span');

      innerElem.style.position        = 'absolute';
      innerElem.style.top             = '1px';
      innerElem.style.left            = '1px';
      innerElem.style.width           = '11px';
      innerElem.style.height          = '11px';
      innerElem.style.borderRadius    = '11px';
      innerElem.style.boxSizing       = 'border-box';
      innerElem.style.boxShadow       = '0 0 6px 0px rgba(255,255,255,0.6)';
      innerElem.style.backgroundColor = captureRegion.btnResizeColor2;

      [
        btnResizeNW, btnResizeN, btnResizeNE,
        btnResizeW, btnResizeE,
        btnResizeSW, btnResizeS, btnResizeSE
      ].forEach(function (elem) {
        elem.style.position     = 'absolute';
        elem.style.width        = '19px';
        elem.style.height       = '19px';
        elem.style.borderRadius = '19px';
        elem.style.border       = '3px solid ' + captureRegion.btnResizeColor1;
        elem.style.boxSizing    = 'border-box';

        elem.appendChild(innerElem.cloneNode(false));
        resizeWrap.appendChild(elem);
      });


      btnResizeNW.style.cursor = 'nw-resize';
      btnResizeN.style.cursor  = 'n-resize';
      btnResizeNE.style.cursor = 'ne-resize';
      btnResizeW.style.cursor  = 'w-resize';
      btnResizeE.style.cursor  = 'e-resize';
      btnResizeSW.style.cursor = 'sw-resize';
      btnResizeS.style.cursor  = 's-resize';
      btnResizeSE.style.cursor = 'se-resize';

      btnResizeTop.style.cursor    = 'n-resize';
      btnResizeRight.style.cursor  = 'e-resize';
      btnResizeBottom.style.cursor = 's-resize';
      btnResizeLeft.style.cursor   = 'w-resize';

      btnResizeNW.style.top  = '-9px';
      btnResizeNW.style.left = '-9px';

      btnResizeN.style.top        = '-9px';
      btnResizeN.style.left       = '50%';
      btnResizeN.style.marginLeft = '-9px';

      btnResizeNE.style.top   = '-9px';
      btnResizeNE.style.right = '-9px';

      btnResizeW.style.left      = '-9px';
      btnResizeW.style.top       = '50%';
      btnResizeW.style.marginTop = '-9px';

      btnResizeE.style.right     = '-9px';
      btnResizeE.style.top       = '50%';
      btnResizeE.style.marginTop = '-9px';

      btnResizeSW.style.left   = '-9px';
      btnResizeSW.style.bottom = '-9px';

      btnResizeS.style.left       = '50%';
      btnResizeS.style.bottom     = '-9px';
      btnResizeS.style.marginLeft = '-9px';

      btnResizeSE.style.right  = '-9px';
      btnResizeSE.style.bottom = '-9px';

      captureRegion.handleNWMouseDown = captureRegion.onControllerMouseDown.bind(null, 1);
      captureRegion.handleNMouseDown  = captureRegion.onControllerMouseDown.bind(null, 2);
      captureRegion.handleNEMouseDown = captureRegion.onControllerMouseDown.bind(null, 3);
      captureRegion.handleEMouseDown  = captureRegion.onControllerMouseDown.bind(null, 4);
      captureRegion.handleSEMouseDown = captureRegion.onControllerMouseDown.bind(null, 5);
      captureRegion.handleSMouseDown  = captureRegion.onControllerMouseDown.bind(null, 6);
      captureRegion.handleSWMouseDown = captureRegion.onControllerMouseDown.bind(null, 7);
      captureRegion.handleWMouseDown  = captureRegion.onControllerMouseDown.bind(null, 8);
    }

    if (!resizeWrap.parentNode) {
      captureRegion.cropCenterElem.appendChild(resizeWrap);
    }
  },

  bindCenter: function () {

    captureRegion.cropCenterElem
      .addEventListener('mousedown', captureRegion.onCenterMouseDown, false);
  },

  unBindCenter: function () {

    captureRegion.cropCenterElem
      .removeEventListener('mousedown', captureRegion.onCenterMouseDown, false);
  },

  bindController: function () {

    captureRegion.ensureController();

    captureRegion.btnResizeNW.addEventListener('mousedown', captureRegion.handleNWMouseDown, false);
    captureRegion.btnResizeN.addEventListener('mousedown', captureRegion.handleNMouseDown, false);
    captureRegion.btnResizeNE.addEventListener('mousedown', captureRegion.handleNEMouseDown, false);
    captureRegion.btnResizeE.addEventListener('mousedown', captureRegion.handleEMouseDown, false);
    captureRegion.btnResizeSE.addEventListener('mousedown', captureRegion.handleSEMouseDown, false);
    captureRegion.btnResizeS.addEventListener('mousedown', captureRegion.handleSMouseDown, false);
    captureRegion.btnResizeSW.addEventListener('mousedown', captureRegion.handleSWMouseDown, false);
    captureRegion.btnResizeW.addEventListener('mousedown', captureRegion.handleWMouseDown, false);

    captureRegion.btnResizeTop.addEventListener('mousedown', captureRegion.handleNMouseDown, false);
    captureRegion.btnResizeRight.addEventListener('mousedown', captureRegion.handleEMouseDown, false);
    captureRegion.btnResizeBottom.addEventListener('mousedown', captureRegion.handleSMouseDown, false);
    captureRegion.btnResizeLeft.addEventListener('mousedown', captureRegion.handleWMouseDown, false);
  },

  unBindController: function () {

    if (captureRegion.resizeWrap) {
      captureRegion.btnResizeNW.removeEventListener('mousedown', captureRegion.handleNWMouseDown, false);
      captureRegion.btnResizeN.removeEventListener('mousedown', captureRegion.handleNMouseDown, false);
      captureRegion.btnResizeNE.removeEventListener('mousedown', captureRegion.handleNEMouseDown, false);
      captureRegion.btnResizeE.removeEventListener('mousedown', captureRegion.handleEMouseDown, false);
      captureRegion.btnResizeSE.removeEventListener('mousedown', captureRegion.handleSEMouseDown, false);
      captureRegion.btnResizeS.removeEventListener('mousedown', captureRegion.handleSMouseDown, false);
      captureRegion.btnResizeSW.removeEventListener('mousedown', captureRegion.handleSWMouseDown, false);
      captureRegion.btnResizeW.removeEventListener('mousedown', captureRegion.handleWMouseDown, false);

      captureRegion.btnResizeTop.removeEventListener('mousedown', captureRegion.handleNMouseDown, false);
      captureRegion.btnResizeRight.removeEventListener('mousedown', captureRegion.handleEMouseDown, false);
      captureRegion.btnResizeBottom.removeEventListener('mousedown', captureRegion.handleSMouseDown, false);
      captureRegion.btnResizeLeft.removeEventListener('mousedown', captureRegion.handleWMouseDown, false);

    }
  },

  clearController: function () {

    utils.removeElement(captureRegion.resizeWrap);
    captureRegion.unBindController();
  },


  currentController: 0,
  cropBounds: null,

  onCenterMouseDown: function (e) {

    e.preventDefault();

    document.body.addEventListener('mousemove', captureRegion.onCenterMouseMove, false);
    document.body.addEventListener('mouseup', captureRegion.onCenterMouseUp, false);

    captureRegion.startX = e.pageX;
    captureRegion.startY = e.pageY;
    captureRegion.lastX  = e.pageX;
    captureRegion.lastY  = e.pageY;

    captureRegion.cropBounds = captureRegion.getCropBounds();


    // mock double click
    // -----------------

    captureRegion.isMouseDown = false;

    captureRegion.clearMouseDownTimer();
    captureRegion.setupMouseDownTimer(function () {
      captureRegion.isMouseDown = true;
      captureRegion.clickCount  = 0;
    });
  },

  onCenterMouseMove: function (e) {

    e.preventDefault();

    captureRegion.isMouseDown = true;
    captureRegion.clickCount  = 0;

    captureRegion.clearScrollTimer();
    captureRegion.clearMouseDownTimer();

    var docElem    = document.documentElement;
    var cropBounds = captureRegion.cropBounds;

    var bounds = {
      width: cropBounds.width,
      height: cropBounds.height
    };

    var left = cropBounds.left + e.pageX - captureRegion.startX;
    var top  = cropBounds.top + e.pageY - captureRegion.startY;

    bounds.left = utils.clamp(left, 0, docElem.scrollWidth - cropBounds.width);
    bounds.top  = utils.clamp(top, 0, docElem.scrollHeight - cropBounds.height);

    captureRegion.updateCropElements(bounds);

    var dx = e.pageX - captureRegion.lastX;
    var dy = e.pageY - captureRegion.lastY;

    captureRegion.lastX = e.pageX;
    captureRegion.lastY = e.pageY;

    // top   : 1
    // right : 2
    // bottom: 3
    // left  : 4
    var direction = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 2 : 4;
    } else {
      direction = dy > 0 ? 3 : 1;
    }

    captureRegion.autoScrollMovement(direction);
  },

  onCenterMouseUp: function () {

    // mock double click
    // -----------------

    if (!captureRegion.isMouseDown) {
      captureRegion.clickCount++;
      captureRegion.clearMouseDownTimer();
    }

    if (captureRegion.clickCount === 1) {
      captureRegion.setupMouseDownTimer(function () {
        captureRegion.isMouseDown = false;
        captureRegion.clickCount  = 0;
      });
    }

    if (captureRegion.clickCount === 2) {
      captureRegion.clickCount = 0;
      captureRegion.captureCrop();
    } else {
      captureRegion.clearScrollTimer();
    }

    document.body.removeEventListener('mousemove', captureRegion.onCenterMouseMove, false);
    document.body.removeEventListener('mouseup', captureRegion.onCenterMouseUp, false);
  },

  autoScrollMovement: function (direction) {

    if (utils.isBodyScrollable()) {

      var body    = document.body;
      var docElem = document.documentElement;

      var clientWidth  = docElem.clientWidth;
      var clientHeight = docElem.clientHeight;
      var scrollWidth  = docElem.scrollWidth;
      var scrollHeight = docElem.scrollHeight;

      var scrollTop  = body.scrollTop;
      var scrollLeft = body.scrollLeft;

      var cropWidth  = captureRegion.cropBounds.width;
      var cropHeight = captureRegion.cropBounds.height;
      var cropLeft   = parseInt(captureRegion.cropCenterElem.style.left, 10);
      var cropTop    = parseInt(captureRegion.cropCenterElem.style.top, 10);

      var xOverflow = cropWidth > clientWidth;
      var yOverflow = cropHeight > clientHeight;

      var scrollDist = captureRegion.scrollDist;

      var scrolled = false;

      if ((!yOverflow || (yOverflow && direction === 1))
        && scrollTop > 0 && cropTop <= scrollTop) {

        scrolled = true;

        cropTop   = Math.max(0, cropTop - scrollDist);
        scrollTop = Math.max(0, scrollTop - scrollDist);

      } else if ((!xOverflow || (xOverflow && direction === 2))
        && cropLeft + cropWidth >= scrollLeft + clientWidth
        && scrollLeft < scrollWidth - clientWidth) {

        scrolled = true;

        cropLeft   = Math.min(scrollWidth - cropWidth, cropLeft + scrollDist);
        scrollLeft = Math.min(scrollWidth - clientWidth, scrollLeft + scrollDist);

      } else if ((!yOverflow || (yOverflow && direction === 3))
        && cropTop + cropHeight >= scrollTop + clientHeight
        && scrollTop < scrollHeight - clientHeight) {

        scrolled = true;

        cropTop   = Math.min(scrollHeight - cropHeight, cropTop + scrollDist);
        scrollTop = Math.min(scrollHeight - clientHeight, scrollTop + scrollDist);

      } else if ((!xOverflow || (xOverflow && direction === 4))
        && scrollLeft > 0 && cropLeft <= scrollLeft) {

        scrolled = true;

        cropLeft   = Math.max(0, cropLeft - scrollDist);
        scrollLeft = Math.max(0, scrollLeft - scrollDist);
      }

      if (scrolled) {

        body.scrollTop  = scrollTop;
        body.scrollLeft = scrollLeft;

        captureRegion.updateCropElements({
          top: cropTop,
          left: cropLeft,
          width: cropWidth,
          height: cropHeight
        });

        captureRegion.setupScrollTimer(function () {
          captureRegion.autoScrollMovement(direction);
        });
      }
    }
  },

  onControllerMouseDown: function (controller, e) {

    e.preventDefault();
    e.stopPropagation();

    captureRegion.currentController = controller;

    document.body.addEventListener('mousemove', captureRegion.onControllerMouseMove, false);
    document.body.addEventListener('mouseup', captureRegion.onControllerMouseUp, false);

    captureRegion.startX = e.pageX;
    captureRegion.startY = e.pageY;
    captureRegion.lastX  = e.pageX;
    captureRegion.lastY  = e.pageY;

    captureRegion.cropBounds = captureRegion.getCropBounds();
  },

  onControllerMouseMove: function (e) {

    e.preventDefault();

    captureRegion.clearScrollTimer();

    var dx = e.pageX - captureRegion.startX;
    var dy = e.pageY - captureRegion.startY;

    var top    = captureRegion.cropBounds.top;
    var left   = captureRegion.cropBounds.left;
    var right  = left + captureRegion.cropBounds.width;
    var bottom = top + captureRegion.cropBounds.height;

    switch (captureRegion.currentController) {

      case 1:
        left += dx;
        top += dy;
        break;

      case 2:
        top += dy;
        break;

      case 3:
        right += dx;
        top += dy;
        break;

      case 4:
        right += dx;
        break;

      case 5:
        right += dx;
        bottom += dy;
        break;

      case 6:
        bottom += dy;
        break;

      case 7:
        left += dx;
        bottom += dy;
        break;

      case 8:
        left += dx;
        break;

      default:
        break;
    }

    captureRegion.updateCropElements({
      top: Math.min(top, bottom),
      left: Math.min(left, right),
      width: Math.abs(left - right),
      height: Math.abs(top - bottom)
    });

    captureRegion.autoScrollController(e.pageX, e.pageY);
  },

  onControllerMouseUp: function (e) {

    captureRegion.currentController = 0;

    captureRegion.clearScrollTimer();

    document.body.removeEventListener('mousemove', captureRegion.onControllerMouseMove, false);
    document.body.removeEventListener('mouseup', captureRegion.onControllerMouseUp, false);

    var bounds = captureRegion.getCropBounds();

    if (!bounds.width || !bounds.height) {
      captureRegion.clearController();
      captureRegion.unBindCenter();
      captureRegion.bindCrossLine();
      captureRegion.updateCrossLine(e);
    }
  },

  autoScrollController: function (pageX, pageY) {

    if (utils.isBodyScrollable()) {

      var body    = document.body;
      var docElem = document.documentElement;

      var clientWidth  = docElem.clientWidth;
      var clientHeight = docElem.clientHeight;
      var scrollWidth  = docElem.scrollWidth;
      var scrollHeight = docElem.scrollHeight;

      var scrollTop  = body.scrollTop;
      var scrollLeft = body.scrollLeft;

      var bounds = captureRegion.getCropBounds();
      var top    = bounds.top;
      var left   = bounds.left;
      var right  = left + bounds.width;
      var bottom = top + bounds.height;

      var scrollDist        = captureRegion.scrollDist;
      var scrollSense       = captureRegion.scrollSense;
      var currentController = captureRegion.currentController;

      var scrolled = false;

      if (scrollLeft > 0
        && currentController !== 2 && currentController !== 6
        && pageX > 0
        && pageX - scrollSense <= scrollLeft) {

        scrolled = true;

        pageX      = Math.max(pageX - scrollDist, 0);
        left       = Math.max(0, left - scrollDist);
        scrollLeft = Math.max(0, scrollLeft - scrollDist);

      } else if (scrollLeft < scrollWidth - clientWidth
        && currentController !== 2 && currentController !== 6
        && pageX < scrollWidth
        && pageX + scrollSense >= scrollLeft + clientWidth) {

        scrolled = true;

        pageX      = Math.min(pageX + scrollDist, scrollWidth);
        right      = Math.min(scrollWidth, right + scrollDist)
        scrollLeft = Math.min(scrollWidth - clientWidth, scrollLeft + scrollDist);

      } else if (scrollTop > 0
        && currentController !== 4 && currentController !== 8
        && pageY > 0
        && pageY - scrollSense <= scrollTop) {

        scrolled = true;

        pageY     = Math.max(pageY - scrollDist, 0);
        top       = Math.max(0, top - scrollDist);
        scrollTop = Math.max(0, scrollTop - scrollDist);

      } else if (scrollTop < scrollHeight - clientHeight
        && currentController !== 4 && currentController !== 8
        && pageY < scrollHeight
        && pageY + scrollSense >= scrollTop + clientHeight) {

        scrolled = true;

        pageY     = Math.min(pageY + scrollDist, scrollHeight);
        bottom    = Math.min(scrollHeight, bottom + scrollDist);
        scrollTop = Math.min(scrollHeight - clientHeight, scrollTop + scrollDist);
      }

      if (scrolled) {

        body.scrollLeft = scrollLeft;
        body.scrollTop  = scrollTop;

        captureRegion.updateCropElements({
          top: Math.min(top, bottom),
          left: Math.min(left, right),
          width: Math.abs(left - right),
          height: Math.abs(top - bottom)
        });

        captureRegion.setupScrollTimer(function () {
          captureRegion.autoScrollController(pageX, pageY);
        });
      }
    }
  },


  // auto scroll
  // -----------
  scrollDist: 50,
  scrollSense: 5,
  scrollDelay: 50,
  scrollTimer: 0,

  setupScrollTimer: function (callback) {

    captureRegion.scrollTimer = setTimeout(callback, captureRegion.scrollDelay);
  },

  clearScrollTimer: function () {

    if (captureRegion.scrollTimer) {
      clearTimeout(captureRegion.scrollTimer);
      captureRegion.scrollTimer = 0;
    }
  }
};

var worker = {

  ratio: window.devicePixelRatio || 1,
  delay: 200,
  timer: 0,

  fragments: null,
  needScroll: null,
  savedStates: null,

  targetElem: null,
  scrollParent: null,

  originOverflow: null,
  originScrollTop: null,
  originScrollLeft: null,

  targetTop: null,
  targetLeft: null,
  startScrollTop: null,
  startScrollLeft: null,

  bindEvents: function () {

    document.body.addEventListener('keydown', worker.onKeyDown, false);
  },

  unBindEvents: function () {

    document.body.removeEventListener('keydown', worker.onKeyDown, false);
  },

  onKeyDown: function onShortCut(e) {

    switch (e.keyCode) {

      case 27: // esc
        worker.abandon();
        break;

      default:
        break;
    }
  },

  start: function (targetElem) {

    if (targetElem) {
      worker.targetElem = targetElem;
    }

    if (worker.targetElem) {

      worker.bindEvents();
      worker.prepareFragments();
      if (worker.hasFragment()) {
        worker.dispatch(true);
      }
    }
  },

  pause: function () {

    if (worker.timer) {
      clearTimeout(worker.timer);
    }

    worker.unBindEvents();
  },

  abandon: function () {

    worker.clear();
    worker.sendMessage({ action: 'onCaptureAbandoned' });
  },

  clear: function () {

    if (worker.needScroll === true) {
      worker.restoreScrollBar();
    }

    worker.restoreViewports();

    worker.timer        = 0;
    worker.fragments    = null;
    worker.needScroll   = null;
    worker.savedStates  = null;
    worker.targetElem   = null;
    worker.scrollParent = null;

    worker.unBindEvents();
  },

  finish: function () {

    worker.clear();
    worker.sendMessage({ action: 'onCaptureEnd' });
  },

  dispatch: function (isFirst) {

    if (worker.hasFragment()) {
      worker.nextFragment(isFirst);
    } else {
      worker.finish();
    }
  },

  nextFragment: function (isFirst) {

    var next = worker.fragments.shift();

    if (worker.needScroll === true) {

      var scrollParent    = worker.scrollParent;
      var startScrollTop  = worker.startScrollTop;
      var startScrollLeft = worker.startScrollLeft;

      var targetTop  = worker.targetTop;
      var targetLeft = worker.targetLeft;

      scrollParent.scrollTop  = next.dy + startScrollTop;
      scrollParent.scrollLeft = next.dx + startScrollLeft;

      next.sx = scrollParent.scrollLeft < next.dx + startScrollLeft
        ? targetLeft + next.dx + startScrollLeft - scrollParent.scrollLeft
        : targetLeft;

      next.sy = scrollParent.scrollTop < next.dy + startScrollTop
        ? targetTop + next.dy + startScrollTop - scrollParent.scrollTop
        : targetTop;
    }

    worker.timer = setTimeout(function () {
      worker.sendMessage({ action: 'onFragment', fragment: next });
    }, isFirst ? 50 : worker.delay);
  },

  hasFragment: function () {

    return worker.fragments && worker.fragments.length > 0;
  },

  prepareFragments: function () {

    var targetElem = worker.targetElem;

    if (targetElem) {

      worker.scrollParent = utils.isBody(targetElem)
        ? targetElem.ownerDocument.body
        : utils.getScrollParent(targetElem);

      worker.adjustViewports();
      worker.collectFragments();

      worker.needScroll = worker.fragments.length > 1;

      if (worker.needScroll === true) {

        var bounds = utils.getBounds(targetElem);

        worker.targetTop       = bounds.top;
        worker.targetLeft      = bounds.left;
        worker.startScrollTop  = worker.scrollParent.scrollTop;
        worker.startScrollLeft = worker.scrollParent.scrollLeft;
      }
    }
  },

  collectFragments: function () {

    var fragments = worker.fragments = [];
    var targetElem   = worker.targetElem;
    var scrollParent = worker.scrollParent;

    if (utils.isOverflow(targetElem, scrollParent)) { // scroll capture

      worker.hideScrollBar();

      // the screen capture size
      var tSize       = utils.getElementSize(targetElem);
      var totalWidth  = tSize.width;
      var totalHeight = tSize.height;

      // viewport size
      var vSize  = utils.getViewportSize(scrollParent);
      var xDelta = vSize.width;
      var yDelta = vSize.height;

      // collect the capture blocks
      var xPos = 0;
      var yPos = 0;

      while (yPos < totalHeight) {

        xPos = 0;

        while (xPos < totalWidth) {

          fragments.push({
            dx: xPos,
            dy: yPos,
            width: Math.min(xDelta, totalWidth - xPos),
            height: Math.min(yDelta, totalHeight - yPos),
            totalWidth: totalWidth,
            totalHeight: totalHeight,
            ratio: worker.ratio
          });

          xPos += xDelta;
        }

        yPos += yDelta;
      }

    } else { // normal capture

      var bounds = utils.getBounds(targetElem);

      fragments.push({
        sx: bounds.left,
        sy: bounds.top,
        dx: 0,
        dy: 0,
        width: bounds.width,
        height: bounds.height,
        totalWidth: bounds.width,
        totalHeight: bounds.height,
        ratio: worker.ratio
      });
    }
  },

  hideScrollBar: function () {

    // save parent's status
    worker.originOverflow   = worker.scrollParent.style.overflow;
    worker.originScrollTop  = worker.scrollParent.scrollTop;
    worker.originScrollLeft = worker.scrollParent.scrollLeft;

    // disable all scrollBars, restore it when captured
    utils.setStyle(worker.scrollParent, {
      overflow: 'hidden'
    });
  },

  restoreScrollBar: function () {

    // restore the parent's scrollBar
    worker.scrollParent.style.overflow = worker.originOverflow;
    worker.scrollParent.scrollTop      = worker.originScrollTop;
    worker.scrollParent.scrollLeft     = worker.originScrollLeft;
  },

  adjustViewports: function () {

    var savedStates = worker.savedStates = [];
    var targetElem   = worker.targetElem;
    var scrollParent = worker.scrollParent;

    if (utils.isOverflow(targetElem, scrollParent)) {

      savedStates.push({
        element: scrollParent,
        scrollTop: scrollParent.scrollTop,
        scrollLeft: scrollParent.scrollLeft
      });

      if (utils.isBody(scrollParent)) {

        var bounds = utils.getBounds(targetElem);

        scrollParent.scrollTop += bounds.top;
        scrollParent.scrollLeft += bounds.left;
      } else {

        var offset = utils.getOffset(targetElem, scrollParent);

        scrollParent.scrollTop  = offset.top;
        scrollParent.scrollLeft = offset.left;
      }
    }

    var vSize  = utils.getViewportSize(document.body);
    var parent = scrollParent;

    while (!utils.isBody(parent)) {

      var top  = 0;
      var left = 0;

      var pBounds = utils.getBounds(parent);
      var tBounds = utils.getBounds(targetElem);

      if (tBounds.top < 0) {

        top = pBounds.top >= 0 ? tBounds.top : Math.max(tBounds.top, pBounds.top);

      } else if (tBounds.top + tBounds.height > vSize.height) {

        top = tBounds.top + tBounds.height - vSize.height;
        if (pBounds.top >= 0) {
          top = Math.min(top, pBounds.top);
        }
      }

      if (tBounds.left < 0) {

        left = pBounds.left >= 0 ? tBounds.left : Math.max(tBounds.left, pBounds.left);

      } else if (tBounds.left + tBounds.width > vSize.width) {

        left = tBounds.left + tBounds.width - vSize.width;
        if (pBounds.left >= 0) {
          left = Math.min(left, pBounds.left);
        }
      }

      if (top !== 0 || left !== 0) {

        var container = utils.getScrollParent(parent);

        savedStates.push({
          element: container,
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft
        });

        container.scrollTop += top;
        container.scrollLeft += left;

        parent = container;

      } else {
        break;
      }
    }
  },

  restoreViewports: function () {

    if (worker.savedStates) {
      worker.savedStates.forEach(function (state) {
        state.element.scrollTop  = state.scrollTop;
        state.element.scrollLeft = state.scrollLeft;
      });
    }

    worker.savedStates = null;
  },

  fixedElementCheck: function () {},

  fixedElementRestore: function () {},

  hideFixedElement: function () {},

  showFixedElement: function () {},

  sendMessage: function (message) {

    chrome.runtime.sendMessage(message);
  },
};

var handler = {

  captureElement: function () { captureElement.start(); },

  captureRegion: function () { captureRegion.start(); },

  captureEntire: function () { worker.start(document.documentElement); },

  nextFragment: function () { worker.dispatch(); },
};

var utils = {

  isObject: function (val) {

    return typeof val === 'object';
  },

  isUndefined: function (val) {

    return typeof val === 'undefined';
  },

  max: function (numbers) {

    return Math.max.apply(Math, numbers.filter(function (x) { return !utils.isUndefined(x); }));
  },

  clamp: function (value, min, max) {

    return min < max
      ? (value < min ? min : value > max ? max : value)
      : (value < max ? max : value > min ? min : value);
  },

  removeElement: function (elem) {

    if (elem && elem.parentNode) {
      elem.parentNode.removeChild(elem);
    }
  },

  createElement: function (targetName) {

    return document.createElement(targetName);
  },

  createDiv: function () {

    return utils.createElement('div');
  },

  setProp: function (elem, prop, value) {

    if (utils.isObject(prop)) {
      for (var key in prop) {
        elem[key] = prop[key];
      }
    } else {
      elem[prop] = value;
    }
  },

  setStyle: function (elem, prop, value) {

    if (utils.isObject(prop)) {
      for (var key in prop) {
        elem.style[key] = prop[key];
      }
    } else {
      elem.style[prop] = value;
    }
  },

  setZIndex: function (elem, zIndex) {

    utils.setStyle(elem, 'zIndex',
      utils.isUndefined(zIndex) ? 2147483630 : zIndex);
  },

  isBody: function (elem) {

    return elem === document
      || elem === document.body
      || elem === document.documentElement;
  },

  isBodyScrollable: function () {

    var docElem = document.documentElement;
    return docElem.scrollWidth > docElem.clientWidth
      || docElem.scrollHeight > docElem.clientHeight;
  },

  isOverflow: function (elem, parent) {

    var bounds = utils.getBounds(elem);

    // parent is body
    if (utils.isBody(parent)) {

      if (bounds.left < 0 || bounds.top < 0) {
        return true;
      }

      var vSize = utils.getViewportSize(parent);

      if (elem === elem.ownerDocument.body) {
        return elem.scrollWidth > vSize.width
          || elem.scrollHeight > vSize.height;
      }

      return bounds.left + bounds.width > vSize.width
        || bounds.top + bounds.height > vSize.height;
    }

    if (bounds.width > parent.clientWidth
      || bounds.height > parent.clientHeight) {
      return true;
    }

    var offset = utils.getOffset(elem, parent);

    return bounds.width + offset.left - parent.scrollLeft > parent.clientWidth
      || bounds.height + offset.top - parent.scrollTop > parent.clientHeight;
  },

  getComputedStyle: function (elem) {
    return elem.ownerDocument.defaultView.getComputedStyle(elem, null);
  },

  getBounds: function (elem) {

    var doc;

    if (elem === document) {
      doc  = document;
      elem = document.documentElement;
    } else {
      doc = elem.ownerDocument;
    }

    var docEle = doc.documentElement;
    var bounds = {};

    // The original object returned by getBoundingClientRect is immutable,
    // so we clone it.
    var rect = elem.getBoundingClientRect();
    for (var k in rect) {
      bounds[k] = rect[k];
    }

    if (utils.isUndefined(bounds.width)) {
      bounds.width = document.body.scrollWidth - bounds.left - bounds.right;
    }
    if (utils.isUndefined(bounds.height)) {
      bounds.height = document.body.scrollHeight - bounds.top - bounds.bottom;
    }

    bounds.top    = bounds.top - docEle.clientTop;
    bounds.left   = bounds.left - docEle.clientLeft;
    bounds.right  = doc.body.clientWidth - bounds.width - bounds.left;
    bounds.bottom = doc.body.clientHeight - bounds.height - bounds.top;

    return bounds;
  },

  getOffset: function (elem, relativeElem) {

    var top  = 0;
    var left = 0;

    var computed  = utils.getComputedStyle(relativeElem);
    var position  = computed.getPropertyValue('position');
    var inlinePos = '';

    if (position === 'static') {
      inlinePos = relativeElem.style.position;

      relativeElem.style.position = 'relative';
    }

    while (elem && elem !== relativeElem) {
      top += elem.offsetTop;
      left += elem.offsetLeft;

      elem = elem.offsetParent;
    }

    relativeElem.style.position = inlinePos;

    return {
      left: left,
      top: top
    };
  },

  getDocumentSize: function (doc) {

    doc = doc || document;

    var body = doc.body;
    var html = doc.documentElement;

    return {
      width: utils.max([
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
      ]),
      height: utils.max([
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      ])
    }
  },

  getElementSize: function (elem) {

    return utils.isBody(elem)
      ? utils.getDocumentSize(elem.ownerDocument)
      : {
      width: utils.max([elem.offsetWidth, elem.clientWidth]),
      height: utils.max([elem.offsetHeight, elem.clientHeight])
    };
  },

  getViewportSize: function (elem) {

    elem = utils.isBody(elem) ? elem.ownerDocument.documentElement : elem;

    return {
      width: elem.clientWidth,
      height: elem.clientHeight
    }
  },

  getScrollParent: function (elem) {

    // In firefox if the el is inside an iframe with display: none;
    // window.getComputedStyle() will return null;
    // https://bugzilla.mozilla.org/show_bug.cgi?id=548397

    var computed = utils.getComputedStyle(elem) || {};
    var position = computed.position;

    if (position === 'fixed') {
      return elem;
    }

    var parent = elem;

    while (parent = parent.parentNode) {
      var style;
      try {
        style = utils.getComputedStyle(parent);
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
  },
};


// message
// -------

// handle message from background
chrome.runtime.onMessage.addListener(function (message, sender) {
  if (sender && sender.id === chrome.runtime.id) {
    var action = message.action;
    if (action && handler[action]) {
      handler[action]();
    }
  }
});


// content script check
window.isContentScriptLoaded = true;
