'use strict';

var handler = {

  captureElement: function () { nodeCapture.start(); },

  captureRegion: function () { cropCapture.start(); },

  captureEntire: function () { worker.start(document.documentElement); },

  captureVisible: function () {

    var width  = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;

    worker.fragments = [{
      sx: 0,
      sy: 0,
      dx: 0,
      dy: 0,
      width: width,
      height: height,
      totalWidth: width,
      totalHeight: height,
      ratio: window.devicePixelRatio
    }];

    worker.dispatch(true);
  },

  nextFragment: function () { worker.dispatch(); },
};

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

var nodeCapture = {

  docWidth: 0,
  docHeight: 0,
  targetElem: null,
  overlayElem: null,
  outlineElem: null,

  start: function () {

    antLine.ensureStyle();
    nodeCapture.ensureOverlay();
    nodeCapture.bindEvents();
  },

  clear: function () {

    antLine.clearStyle();
    nodeCapture.removeOverlay();
    nodeCapture.unBindEvents();
    nodeCapture.targetElem = null;
  },

  ensureOverlay: function () {

    var overlayElem = nodeCapture.overlayElem;
    if (!overlayElem) {

      overlayElem = utils.createDiv();

      utils.setStyle(overlayElem, {
        pointerEvents: 'none',
        position: 'absolute',
        left: '0px',
        top: '0px'
      });

      nodeCapture.overlayElem = overlayElem;
      nodeCapture.outlineElem = utils.createDiv();

      utils.setStyle(nodeCapture.outlineElem, 'position', 'absolute');
      utils.setZIndex(nodeCapture.outlineElem);

      overlayElem.appendChild(nodeCapture.outlineElem);
    }

    if (!overlayElem.parentNode) {
      document.body.appendChild(overlayElem);
    }

    nodeCapture.onWindowResize();
  },

  removeOverlay: function () {

    utils.removeElement(nodeCapture.overlayElem);

    var outlineElem = nodeCapture.outlineElem;
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

    document.body.addEventListener('mousemove', nodeCapture.onMouseMove, false);
    document.body.addEventListener('mousedown', nodeCapture.onMouseDown, false);
    document.body.addEventListener('keydown', nodeCapture.onKeyDown, false);

    window.addEventListener('resize', nodeCapture.onWindowResize, false);
  },

  unBindEvents: function () {

    document.body.removeEventListener('mousemove', nodeCapture.onMouseMove, false);
    document.body.removeEventListener('mousedown', nodeCapture.onMouseDown, false);
    document.body.removeEventListener('keydown', nodeCapture.onKeyDown, false);

    window.removeEventListener('resize', nodeCapture.onWindowResize, false);
  },

  onWindowResize: function () {

    var docSize = utils.getDocumentSize();

    nodeCapture.docWidth  = docSize.width;
    nodeCapture.docHeight = docSize.height;

    utils.setStyle(nodeCapture.overlayElem, {
      width: nodeCapture.docWidth + 'px',
      height: nodeCapture.docHeight + 'px'
    });
  },

  onMouseMove: function updateTarget(e) {

    if (nodeCapture.targetElem !== e.target) {

      nodeCapture.targetElem = e.target;

      var sw        = antLine.strokeWidth;
      var bounds    = utils.getBounds(e.target);
      var docWidth  = nodeCapture.docWidth;
      var docHeight = nodeCapture.docHeight;

      utils.setStyle(nodeCapture.outlineElem, {
        top: Math.max(document.body.scrollTop + bounds.top - sw, 0) + 'px',
        left: Math.max(document.body.scrollLeft + bounds.left - sw, 0) + 'px',
        width: Math.min(docWidth, bounds.width + 2 * sw) + 'px',
        height: Math.min(docHeight, bounds.height + 2 * sw) + 'px'
      });

      utils.setProp(nodeCapture.outlineElem, {
        innerHTML: antLine.create(docWidth, docHeight, bounds.width, bounds.height, true, true)
      });
    }
  },

  onMouseDown: function doCapture() {

    worker.start(nodeCapture.targetElem);
    nodeCapture.clear();
  },

  onKeyDown: function onShortCut(e) {

    switch (e.keyCode) {

      case 13: // enter
        nodeCapture.onMouseDown();
        break;

      case 27: // esc
        nodeCapture.clear();
        break;

      default:
        break;
    }
  }
};

var cropCapture = {

  docWidth: 0,
  docHeight: 0,

  start: function () {

    cropCapture.ensureCropElements();

    window.addEventListener('resize', cropCapture.onWindowResize, false);
    document.body.addEventListener('keydown', cropCapture.onKeyDown, false);

    cropCapture.bindCrossLine();
    cropCapture.onWindowResize();
  },

  clear: function () {

    cropCapture.clearCrossLine();
    cropCapture.clearController();
    cropCapture.clearCrop();

    antLine.clearStyle();

    window.removeEventListener('resize', cropCapture.onWindowResize, false);
    document.body.removeEventListener('keydown', cropCapture.onKeyDown, false);
  },

  captureCrop: function () {

    worker.start(cropCapture.cropCenterElem)
    cropCapture.clear();
  },

  onWindowResize: function () {

    var dSize = utils.getDocumentSize();

    cropCapture.docWidth  = dSize.width;
    cropCapture.docHeight = dSize.height;

    utils.setStyle(cropCapture.cropWrapElem, {
      width: dSize.width + 'px',
      height: dSize.height + 'px'
    });

    cropCapture.updateCropElements();
  },

  onKeyDown: function (e) {

    switch (e.keyCode) {

      case 13: // enter

        var bounds = cropCapture.getCropBounds();
        if (bounds.width > 0 && bounds.height > 0) {

          cropCapture.captureCrop();

        } else {

          var x = document.body.scrollLeft + document.documentElement.clientWidth / 2;
          var y = document.body.scrollTop + document.documentElement.clientHeight / 2;

          antLine.ensureStyle();

          cropCapture.createDemoCrop(x, y);
          cropCapture.clearCrossLine();
          cropCapture.bindCenter();
          cropCapture.bindController();
        }
        break;

      case 27: // esc
        cropCapture.clear();
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

    var cropWrapElem = cropCapture.cropWrapElem;

    if (!cropWrapElem) {

      cropWrapElem = cropCapture.cropWrapElem = utils.createDiv();

      utils.setStyle(cropWrapElem, {
        position: 'absolute',
        left: 0,
        top: 0,
        cursor: 'crosshair',
        boxSizing: 'border-box',
        fontFamily: 'Helvetica, arial, sans-serif'
      });

      utils.setZIndex(cropWrapElem);


      var cropTopElem = cropCapture.cropTopElem = utils.createDiv();
      var cropRightElem = cropCapture.cropRightElem = utils.createDiv();
      var cropBottomElem = cropCapture.cropBottomElem = utils.createDiv();
      var cropLeftElem = cropCapture.cropLeftElem = utils.createDiv();
      var cropCenterElem = cropCapture.cropCenterElem = utils.createDiv();
      var cropAntLineElem = cropCapture.cropAntLineElem = utils.createDiv();

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
          backgroundColor: cropCapture.bgColor
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
        backgroundColor: cropCapture.bgTransparent
      });

      cropCenterElem.appendChild(cropAntLineElem);
    }

    if (!cropWrapElem.parentNode) {
      document.body.appendChild(cropWrapElem);
    }
  },

  updateCropElements: function (bounds) {

    var bounds = bounds || cropCapture.getCropBounds();

    var docWidth  = cropCapture.docWidth;
    var docHeight = cropCapture.docHeight;

    if (bounds.width > 0 && bounds.height > 0) {

      utils.setStyle(cropCapture.cropWrapElem, {
        backgroundColor: cropCapture.bgTransparent
      });

      utils.setStyle(cropCapture.cropTopElem, {
        width: bounds.left + bounds.width + 'px',
        height: bounds.top + 'px'
      });

      utils.setStyle(cropCapture.cropRightElem, {
        width: docWidth - bounds.left - bounds.width + 'px',
        height: bounds.top + bounds.height + 'px'
      });

      utils.setStyle(cropCapture.cropBottomElem, {
        width: docWidth - bounds.left + 'px',
        height: docHeight - bounds.top - bounds.height + 'px'
      });

      utils.setStyle(cropCapture.cropLeftElem, {
        width: bounds.left + 'px',
        height: docHeight - bounds.top + 'px'
      });

      utils.setStyle(cropCapture.cropCenterElem, {
        top: bounds.top + 'px',
        left: bounds.left + 'px',
        width: bounds.width + 'px',
        height: bounds.height + 'px'
      });

      cropCapture.cropAntLineElem.innerHTML = antLine.create(docWidth, docHeight, bounds.width, bounds.height, false, false);

      if (cropCapture.resizeWrap) {
        cropCapture.resizeWrap.style.display = '';
      }

    } else {

      utils.setStyle(cropCapture.cropWrapElem, {
        backgroundColor: cropCapture.bgColor
      });

      cropCapture.cropTopElem.style.width  = 0;
      cropCapture.cropTopElem.style.height = 0;

      cropCapture.cropRightElem.style.width  = 0;
      cropCapture.cropRightElem.style.height = 0;

      cropCapture.cropBottomElem.style.width  = 0;
      cropCapture.cropBottomElem.style.height = 0;

      cropCapture.cropLeftElem.style.width  = 0;
      cropCapture.cropLeftElem.style.height = 0;

      cropCapture.cropCenterElem.style.top    = 0;
      cropCapture.cropCenterElem.style.left   = 0;
      cropCapture.cropCenterElem.style.width  = 0;
      cropCapture.cropCenterElem.style.height = 0;

      cropCapture.cropAntLineElem.innerHTML = '';

      if (cropCapture.resizeWrap) {
        cropCapture.resizeWrap.style.display = 'none';
      }
    }
  },

  getCropBounds: function () {

    var cropCenterElem = cropCapture.cropCenterElem;

    return {
      top: parseInt(cropCenterElem.style.top, 10),
      left: parseInt(cropCenterElem.style.left, 10),
      width: cropCenterElem.offsetWidth || cropCenterElem.clientWidth,
      height: cropCenterElem.offsetHeight || cropCenterElem.clientHeight
    };
  },

  clearCrop: function () {

    utils.removeElement(cropCapture.cropWrapElem);

    cropCapture.updateCropElements({
      left: 0,
      top: 0,
      width: 0,
      height: 0
    });

    cropCapture.unBindCenter();
  },


  // cross line
  // ----------
  crossWrapElem: null,
  crossVElem: null,
  crossHElem: null,
  crossPosElem: null,
  crossColor: '#f0f0f0',

  ensureCrossLine: function () {

    var crossWrapElem = cropCapture.crossWrapElem;

    if (!crossWrapElem) {

      crossWrapElem = cropCapture.crossWrapElem = utils.createDiv();

      var crossPosElem = cropCapture.crossPosElem = utils.createDiv();
      var crossVElem = cropCapture.crossVElem = utils.createDiv();
      var crossHElem = cropCapture.crossHElem = utils.createDiv();

      utils.setStyle(crossVElem, {
        position: 'absolute',
        top: 0,
        bottom: 0,
        padding: 0,
        margin: 0,
        width: '1px',
        boxSizing: 'border-box',
        backgroundColor: cropCapture.crossColor
      });

      utils.setStyle(crossHElem, {
        position: 'absolute',
        left: 0,
        right: 0,
        padding: 0,
        margin: 0,
        height: '1px',
        boxSizing: 'border-box',
        backgroundColor: cropCapture.crossColor
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
        color: cropCapture.crossColor,
        backgroundColor: 'rgba(0,0,0,0.8)'
      });

      crossWrapElem.appendChild(crossVElem);
      crossWrapElem.appendChild(crossHElem);
      crossWrapElem.appendChild(crossPosElem);
    }

    if (!crossWrapElem.parentNode) {
      cropCapture.cropWrapElem.appendChild(crossWrapElem);
    }
  },

  clearCrossLine: function () {

    cropCapture.clearScrollTimer();

    cropCapture.crossVElem.style.left  = '-1px';
    cropCapture.crossHElem.style.top   = '-1px';
    cropCapture.crossPosElem.innerText = '';

    utils.removeElement(cropCapture.crossWrapElem);
    cropCapture.unBindCrossLine();
  },

  bindCrossLine: function () {

    document.body.addEventListener('mousemove', cropCapture.updateCrossLine, false);
    document.body.addEventListener('mousedown', cropCapture.onCropMouseDown, false);
  },

  unBindCrossLine: function () {

    document.body.removeEventListener('mousemove', cropCapture.updateCrossLine, false);
    document.body.removeEventListener('mousedown', cropCapture.onCropMouseDown, false);
  },

  updateCrossLine: function (e) {

    cropCapture.ensureCrossLine();
    cropCapture.clearScrollTimer();
    cropCapture.placeCrossLine(e.pageX, e.pageY);
    cropCapture.autoScrollCrossLine(e.pageX, e.pageY);
  },

  placeCrossLine: function (pageX, pageY) {

    cropCapture.crossVElem.style.left = Math.max(pageX - 1, 0) + 'px';
    cropCapture.crossHElem.style.top  = Math.max(pageY - 1, 0) + 'px';

    var crossPosElem = cropCapture.crossPosElem;

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

      var scrollDist  = cropCapture.scrollDist;
      var scrollSense = cropCapture.scrollSense;

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

        cropCapture.placeCrossLine(pageX, pageY);
        cropCapture.setupScrollTimer(function () {
          cropCapture.autoScrollCrossLine(pageX, pageY);
        });
      }
    }
  },


  mouseDownTimer: 0,
  mouseDownDelay: 200,
  isMouseDown: false,
  clickCount: 0,

  setupMouseDownTimer: function (callback) {

    cropCapture.mouseDownTimer = setTimeout(callback, cropCapture.mouseDownDelay);
  },

  clearMouseDownTimer: function () {

    if (cropCapture.mouseDownTimer) {
      clearTimeout(cropCapture.mouseDownTimer);
      cropCapture.mouseDownTimer = 0;
    }
  },


  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,


  onCropMouseDown: function (e) {

    e.preventDefault();

    cropCapture.clearCrossLine();

    document.body.addEventListener('mousemove', cropCapture.onCropMouseMove, false);
    document.body.addEventListener('mouseup', cropCapture.onCropMouseUp, false);

    cropCapture.startX = e.pageX;
    cropCapture.startY = e.pageY;

    cropCapture.isMouseDown = false;

    cropCapture.setupMouseDownTimer(function () {
      cropCapture.isMouseDown = true;
    });
  },

  onCropMouseMove: function (e) {

    e.preventDefault();

    cropCapture.clearScrollTimer();
    cropCapture.clearMouseDownTimer();
    cropCapture.isMouseDown = true;

    var pageX  = e.pageX;
    var pageY  = e.pageY;
    var startX = cropCapture.startX;
    var startY = cropCapture.startY;

    cropCapture.updateCropElements({
      top: Math.min(pageY, startY),
      left: Math.min(pageX, startX),
      width: Math.abs(pageX - startX),
      height: Math.abs(pageY - startY),
    });

    cropCapture.autoScrollCrop(pageX, pageY);
  },

  onCropMouseUp: function (e) {

    cropCapture.clearScrollTimer();

    document.body.removeEventListener('mousemove', cropCapture.onCropMouseMove, false);
    document.body.removeEventListener('mouseup', cropCapture.onCropMouseUp, false);

    if (!cropCapture.isMouseDown) {
      cropCapture.clearMouseDownTimer();
      // create a crop when click
      cropCapture.createDemoCrop(e.pageX, e.pageY);
    }

    var bounds = cropCapture.getCropBounds();
    if (bounds.width && bounds.height) {
      antLine.ensureStyle();
      cropCapture.bindCenter();
      cropCapture.bindController();
    } else {
      cropCapture.bindCrossLine();
      cropCapture.updateCrossLine(e);
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

      var bounds = cropCapture.getCropBounds();
      var top    = bounds.top;
      var left   = bounds.left;
      var width  = bounds.width;
      var height = bounds.height;

      var scrollDist  = cropCapture.scrollDist;
      var scrollSense = cropCapture.scrollSense;

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

        cropCapture.updateCropElements({
          top: top,
          left: left,
          width: width,
          height: height
        });

        cropCapture.setupScrollTimer(function () {
          cropCapture.autoScrollCrop(pageX, pageY);
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

    cropCapture.updateCropElements({
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

    var resizeWrap = cropCapture.resizeWrap;

    if (!resizeWrap) {

      resizeWrap = cropCapture.resizeWrap = utils.createDiv();

      var btnResizeNW = cropCapture.btnResizeNW = utils.createDiv();
      var btnResizeN = cropCapture.btnResizeN = utils.createDiv();
      var btnResizeNE = cropCapture.btnResizeNE = utils.createDiv();
      var btnResizeW = cropCapture.btnResizeW = utils.createDiv();
      var btnResizeE = cropCapture.btnResizeE = utils.createDiv();
      var btnResizeSW = cropCapture.btnResizeSW = utils.createDiv();
      var btnResizeS = cropCapture.btnResizeS = utils.createDiv();
      var btnResizeSE = cropCapture.btnResizeSE = utils.createDiv();
      var btnResizeTop = cropCapture.btnResizeTop = utils.createDiv();
      var btnResizeRight = cropCapture.btnResizeRight = utils.createDiv();
      var btnResizeBottom = cropCapture.btnResizeBottom = utils.createDiv();
      var btnResizeLeft = cropCapture.btnResizeLeft = utils.createDiv();

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
      innerElem.style.backgroundColor = cropCapture.btnResizeColor2;

      [
        btnResizeNW, btnResizeN, btnResizeNE,
        btnResizeW, btnResizeE,
        btnResizeSW, btnResizeS, btnResizeSE
      ].forEach(function (elem) {
        elem.style.position     = 'absolute';
        elem.style.width        = '19px';
        elem.style.height       = '19px';
        elem.style.borderRadius = '19px';
        elem.style.border       = '3px solid ' + cropCapture.btnResizeColor1;
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

      cropCapture.handleNWMouseDown = cropCapture.onControllerMouseDown.bind(null, 1);
      cropCapture.handleNMouseDown  = cropCapture.onControllerMouseDown.bind(null, 2);
      cropCapture.handleNEMouseDown = cropCapture.onControllerMouseDown.bind(null, 3);
      cropCapture.handleEMouseDown  = cropCapture.onControllerMouseDown.bind(null, 4);
      cropCapture.handleSEMouseDown = cropCapture.onControllerMouseDown.bind(null, 5);
      cropCapture.handleSMouseDown  = cropCapture.onControllerMouseDown.bind(null, 6);
      cropCapture.handleSWMouseDown = cropCapture.onControllerMouseDown.bind(null, 7);
      cropCapture.handleWMouseDown  = cropCapture.onControllerMouseDown.bind(null, 8);
    }

    if (!resizeWrap.parentNode) {
      cropCapture.cropCenterElem.appendChild(resizeWrap);
    }
  },

  bindCenter: function () {

    cropCapture.cropCenterElem
      .addEventListener('mousedown', cropCapture.onCenterMouseDown, false);
  },

  unBindCenter: function () {

    cropCapture.cropCenterElem
      .removeEventListener('mousedown', cropCapture.onCenterMouseDown, false);
  },

  bindController: function () {

    cropCapture.ensureController();

    cropCapture.btnResizeNW.addEventListener('mousedown', cropCapture.handleNWMouseDown, false);
    cropCapture.btnResizeN.addEventListener('mousedown', cropCapture.handleNMouseDown, false);
    cropCapture.btnResizeNE.addEventListener('mousedown', cropCapture.handleNEMouseDown, false);
    cropCapture.btnResizeE.addEventListener('mousedown', cropCapture.handleEMouseDown, false);
    cropCapture.btnResizeSE.addEventListener('mousedown', cropCapture.handleSEMouseDown, false);
    cropCapture.btnResizeS.addEventListener('mousedown', cropCapture.handleSMouseDown, false);
    cropCapture.btnResizeSW.addEventListener('mousedown', cropCapture.handleSWMouseDown, false);
    cropCapture.btnResizeW.addEventListener('mousedown', cropCapture.handleWMouseDown, false);

    cropCapture.btnResizeTop.addEventListener('mousedown', cropCapture.handleNMouseDown, false);
    cropCapture.btnResizeRight.addEventListener('mousedown', cropCapture.handleEMouseDown, false);
    cropCapture.btnResizeBottom.addEventListener('mousedown', cropCapture.handleSMouseDown, false);
    cropCapture.btnResizeLeft.addEventListener('mousedown', cropCapture.handleWMouseDown, false);
  },

  unBindController: function () {

    if (cropCapture.resizeWrap) {
      cropCapture.btnResizeNW.removeEventListener('mousedown', cropCapture.handleNWMouseDown, false);
      cropCapture.btnResizeN.removeEventListener('mousedown', cropCapture.handleNMouseDown, false);
      cropCapture.btnResizeNE.removeEventListener('mousedown', cropCapture.handleNEMouseDown, false);
      cropCapture.btnResizeE.removeEventListener('mousedown', cropCapture.handleEMouseDown, false);
      cropCapture.btnResizeSE.removeEventListener('mousedown', cropCapture.handleSEMouseDown, false);
      cropCapture.btnResizeS.removeEventListener('mousedown', cropCapture.handleSMouseDown, false);
      cropCapture.btnResizeSW.removeEventListener('mousedown', cropCapture.handleSWMouseDown, false);
      cropCapture.btnResizeW.removeEventListener('mousedown', cropCapture.handleWMouseDown, false);

      cropCapture.btnResizeTop.removeEventListener('mousedown', cropCapture.handleNMouseDown, false);
      cropCapture.btnResizeRight.removeEventListener('mousedown', cropCapture.handleEMouseDown, false);
      cropCapture.btnResizeBottom.removeEventListener('mousedown', cropCapture.handleSMouseDown, false);
      cropCapture.btnResizeLeft.removeEventListener('mousedown', cropCapture.handleWMouseDown, false);

    }
  },

  clearController: function () {

    utils.removeElement(cropCapture.resizeWrap);
    cropCapture.unBindController();
  },


  currentController: 0,
  cropBounds: null,

  onCenterMouseDown: function (e) {

    e.preventDefault();

    document.body.addEventListener('mousemove', cropCapture.onCenterMouseMove, false);
    document.body.addEventListener('mouseup', cropCapture.onCenterMouseUp, false);

    cropCapture.startX = e.pageX;
    cropCapture.startY = e.pageY;
    cropCapture.lastX  = e.pageX;
    cropCapture.lastY  = e.pageY;

    cropCapture.cropBounds = cropCapture.getCropBounds();


    // mock double click
    // -----------------

    cropCapture.isMouseDown = false;

    cropCapture.clearMouseDownTimer();
    cropCapture.setupMouseDownTimer(function () {
      cropCapture.isMouseDown = true;
      cropCapture.clickCount  = 0;
    });
  },

  onCenterMouseMove: function (e) {

    e.preventDefault();

    cropCapture.isMouseDown = true;
    cropCapture.clickCount  = 0;

    cropCapture.clearScrollTimer();
    cropCapture.clearMouseDownTimer();

    var docElem    = document.documentElement;
    var cropBounds = cropCapture.cropBounds;

    var bounds = {
      width: cropBounds.width,
      height: cropBounds.height
    };

    var left = cropBounds.left + e.pageX - cropCapture.startX;
    var top  = cropBounds.top + e.pageY - cropCapture.startY;

    bounds.left = utils.clamp(left, 0, docElem.scrollWidth - cropBounds.width);
    bounds.top  = utils.clamp(top, 0, docElem.scrollHeight - cropBounds.height);

    cropCapture.updateCropElements(bounds);

    var dx = e.pageX - cropCapture.lastX;
    var dy = e.pageY - cropCapture.lastY;

    cropCapture.lastX = e.pageX;
    cropCapture.lastY = e.pageY;

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

    cropCapture.autoScrollMovement(direction);
  },

  onCenterMouseUp: function () {

    // mock double click
    // -----------------

    if (!cropCapture.isMouseDown) {
      cropCapture.clickCount++;
      cropCapture.clearMouseDownTimer();
    }

    if (cropCapture.clickCount === 1) {
      cropCapture.setupMouseDownTimer(function () {
        cropCapture.isMouseDown = false;
        cropCapture.clickCount  = 0;
      });
    }

    if (cropCapture.clickCount === 2) {
      cropCapture.clickCount = 0;
      cropCapture.captureCrop();
    } else {
      cropCapture.clearScrollTimer();
    }

    document.body.removeEventListener('mousemove', cropCapture.onCenterMouseMove, false);
    document.body.removeEventListener('mouseup', cropCapture.onCenterMouseUp, false);
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

      var cropWidth  = cropCapture.cropBounds.width;
      var cropHeight = cropCapture.cropBounds.height;
      var cropLeft   = parseInt(cropCapture.cropCenterElem.style.left, 10);
      var cropTop    = parseInt(cropCapture.cropCenterElem.style.top, 10);

      var xOverflow = cropWidth > clientWidth;
      var yOverflow = cropHeight > clientHeight;

      var scrollDist = cropCapture.scrollDist;

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

        cropCapture.updateCropElements({
          top: cropTop,
          left: cropLeft,
          width: cropWidth,
          height: cropHeight
        });

        cropCapture.setupScrollTimer(function () {
          cropCapture.autoScrollMovement(direction);
        });
      }
    }
  },

  onControllerMouseDown: function (controller, e) {

    e.preventDefault();
    e.stopPropagation();

    cropCapture.currentController = controller;

    document.body.addEventListener('mousemove', cropCapture.onControllerMouseMove, false);
    document.body.addEventListener('mouseup', cropCapture.onControllerMouseUp, false);

    cropCapture.startX = e.pageX;
    cropCapture.startY = e.pageY;
    cropCapture.lastX  = e.pageX;
    cropCapture.lastY  = e.pageY;

    cropCapture.cropBounds = cropCapture.getCropBounds();
  },

  onControllerMouseMove: function (e) {

    e.preventDefault();

    cropCapture.clearScrollTimer();

    var dx = e.pageX - cropCapture.startX;
    var dy = e.pageY - cropCapture.startY;

    var top    = cropCapture.cropBounds.top;
    var left   = cropCapture.cropBounds.left;
    var right  = left + cropCapture.cropBounds.width;
    var bottom = top + cropCapture.cropBounds.height;

    switch (cropCapture.currentController) {

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

    cropCapture.updateCropElements({
      top: Math.min(top, bottom),
      left: Math.min(left, right),
      width: Math.abs(left - right),
      height: Math.abs(top - bottom)
    });

    cropCapture.autoScrollController(e.pageX, e.pageY);
  },

  onControllerMouseUp: function (e) {

    cropCapture.currentController = 0;

    cropCapture.clearScrollTimer();

    document.body.removeEventListener('mousemove', cropCapture.onControllerMouseMove, false);
    document.body.removeEventListener('mouseup', cropCapture.onControllerMouseUp, false);

    var bounds = cropCapture.getCropBounds();

    if (!bounds.width || !bounds.height) {
      cropCapture.clearController();
      cropCapture.unBindCenter();
      cropCapture.bindCrossLine();
      cropCapture.updateCrossLine(e);
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

      var bounds = cropCapture.getCropBounds();
      var top    = bounds.top;
      var left   = bounds.left;
      var right  = left + bounds.width;
      var bottom = top + bounds.height;

      var scrollDist        = cropCapture.scrollDist;
      var scrollSense       = cropCapture.scrollSense;
      var currentController = cropCapture.currentController;

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

        cropCapture.updateCropElements({
          top: Math.min(top, bottom),
          left: Math.min(left, right),
          width: Math.abs(left - right),
          height: Math.abs(top - bottom)
        });

        cropCapture.setupScrollTimer(function () {
          cropCapture.autoScrollController(pageX, pageY);
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

    cropCapture.scrollTimer = setTimeout(callback, cropCapture.scrollDelay);
  },

  clearScrollTimer: function () {

    if (cropCapture.scrollTimer) {
      clearTimeout(cropCapture.scrollTimer);
      cropCapture.scrollTimer = 0;
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
        worker.dispatch();
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

  dispatch: function () {

    if (worker.hasFragment()) {
      worker.nextFragment();
    } else {
      worker.finish();
    }
  },

  nextFragment: function () {

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
    }, worker.delay);
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
    //worker.originOverflow   = worker.scrollParent.style.overflow;
    //worker.originScrollTop  = worker.scrollParent.scrollTop;
    //worker.originScrollLeft = worker.scrollParent.scrollLeft;
    //
    //// disable all scrollBars, restore it when captured
    //utils.setStyle(worker.scrollParent, {
    //  overflow: 'hidden'
    //});
    //
    var scrollParent = worker.scrollParent;

    utils.exchangeStyle(scrollParent, {
      overflow: 'hidden',
      scrollTop: scrollParent.scrollTop,
      scrollLeft: scrollParent.scrollLeft
    });
  },

  restoreScrollBar: function () {

    // restore the parent's scrollBar
    utils.restoreStyle(worker.scrollParent, ['overflow', 'scrollTop', 'scrollLeft']);
    //worker.scrollParent.style.overflow = worker.originOverflow;
    //worker.scrollParent.scrollTop      = worker.originScrollTop;
    //worker.scrollParent.scrollLeft     = worker.originScrollLeft;
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

  setProp: function (elem, name, value) {

    if (utils.isObject(name)) {
      for (var key in name) {
        elem[key] = name[key];
      }
    } else {
      elem[name] = value;
    }
  },

  setStyle: function (elem, name, value) {

    if (utils.isObject(name)) {
      for (var key in name) {
        elem.style[key] = name[key];
      }
    } else {
      elem.style[name] = value;
    }
  },

  exchangeStyle: function (elem, name, value) {

    var store = elem.__style;
    if (!store) {
      store = elem.__style = {};
    }

    if (utils.isObject(name)) {
      for (var key in name) {
        store[key]      = elem.style[key];
        elem.style[key] = name[key];
      }
    } else {
      store[name]      = elem.style[name];
      elem.style[name] = value;
    }
  },

  restoreStyle: function (elem, names) {

    if (!Array.isArray(names)) {
      names = [names];
    }

    var store = elem.__style || {};

    console.log(store);

    names.forEach(function (name) {
      if (store.hasOwnProperty(name)) {
        elem.style[name] = store[name];
        delete store[name];
      }
    });
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
