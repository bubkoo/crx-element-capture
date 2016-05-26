'use strict';

var handler = {};

(function () {

  // ant line
  // --------

  var styleNode;
  var zIndex      = 2147483630;
  var fillColor   = 'rgba(48,132,242,.2)';
  var strokeWidth = 1;
  var strokeColor = '#ff2f6c'

  function ensureStyle() {

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
  }

  function clearStyle() {
    removeElement(styleNode);
  }

  function createAntLine(fWidth, fHeight, tWidth, tHeight, expand, filled) {

    var width  = Math.min(fWidth, expand ? tWidth + 2 * strokeWidth : tWidth);
    var height = Math.min(fHeight, expand ? tHeight + 2 * strokeWidth : tHeight);

    var xx = strokeWidth / 2;
    var yy = strokeWidth / 2;
    var hw = Math.min(fWidth, expand ? tWidth + strokeWidth : tWidth - xx);
    var vh = Math.min(fHeight, expand ? tHeight + strokeWidth : tHeight - yy);

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

    var html = '' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewport="0 0 {width} {height}" style="position: absolute; left: 0; top: 0; border: 0; padding: 0; margin: 0">' +
      '  <path fill="{fillColor}" ' +
      '        stroke="{strokeColor}" ' +
      '        stroke-width="{strokeWidth}" ' +
      '        stroke-dasharray="4" ' +
      '        style="animation: ant-line 2000s infinite linear; animation-delay: .3s; "' +
      '        d="{d}"></path>' +
      '</svg>';

    return html
      .replace('{d}', pathData)
      .replace(/\{width\}/g, '' + width)
      .replace(/\{height\}/g, '' + height)
      .replace('{fillColor}', filled ? fillColor : 'none')
      .replace('{strokeColor}', '' + strokeColor)
      .replace('{strokeWidth}', '' + strokeWidth);
  }


  // crop elements
  // -------------

  var cropWrapElem;
  var cropTopElem;
  var cropRightElem;
  var cropBottomElem;
  var cropLeftElem;
  var cropCenterElem;
  var cropAntLineElem;

  var bgColor       = 'rgba(0,0,0,0.5)';
  var bgTransparent = 'rgba(0,0,0,0)';

  function ensureCropElements() {

    if (!cropWrapElem) {
      cropWrapElem = document.createElement('div');

      cropWrapElem.style.position   = 'absolute';
      cropWrapElem.style.left       = '0';
      cropWrapElem.style.top        = '0';
      cropWrapElem.style.zIndex     = zIndex;
      cropWrapElem.style.cursor     = 'crosshair';
      cropWrapElem.style.boxSizing  = 'border-box';
      cropWrapElem.style.fontFamily = 'Helvetica, arial, sans-serif';

      cropTopElem     = document.createElement('div');
      cropRightElem   = document.createElement('div');
      cropBottomElem  = document.createElement('div');
      cropLeftElem    = document.createElement('div');
      cropCenterElem  = document.createElement('div');
      cropAntLineElem = document.createElement('div');

      [
        cropTopElem,
        cropRightElem,
        cropBottomElem,
        cropLeftElem,
        cropCenterElem
      ].forEach(function (elem) {
        elem.style.position        = 'absolute';
        elem.style.cursor          = 'auto';
        elem.style.backgroundColor = bgColor;

        cropWrapElem.appendChild(elem);
      });

      cropTopElem.style.top  = 0;
      cropTopElem.style.left = 0;

      cropRightElem.style.top   = 0;
      cropRightElem.style.right = 0;

      cropBottomElem.style.right  = 0;
      cropBottomElem.style.bottom = 0;

      cropLeftElem.style.bottom = 0;
      cropLeftElem.style.left   = 0;

      cropCenterElem.style.cursor          = 'move';
      cropCenterElem.style.boxSizing       = 'border-box';
      cropCenterElem.style.backgroundColor = bgTransparent;

      cropCenterElem.appendChild(cropAntLineElem);
    }

    if (!cropWrapElem.parentNode) {
      document.body.appendChild(cropWrapElem);
    }
  }


  // cross line
  // ----------

  var crossWrapElem;
  var crossVElem;
  var crossHElem;
  var crossPosElem;
  var crossColor = '#f0f0f0';

  function ensureCrossLine() {

    if (!crossWrapElem) {
      crossWrapElem = document.createElement('div');
      crossPosElem  = document.createElement('div');
      crossVElem    = document.createElement('div');
      crossHElem    = document.createElement('div');

      crossVElem.style.position        = 'absolute';
      crossVElem.style.top             = '0';
      crossVElem.style.bottom          = '0';
      crossVElem.style.padding         = '0';
      crossVElem.style.margin          = '0';
      crossVElem.style.width           = '1px';
      crossVElem.style.boxSizing       = 'border-box';
      crossVElem.style.backgroundColor = crossColor;

      crossHElem.style.position        = 'absolute';
      crossHElem.style.left            = '0';
      crossHElem.style.right           = '0';
      crossHElem.style.padding         = '0';
      crossHElem.style.margin          = '0';
      crossHElem.style.height          = '1px';
      crossHElem.style.boxSizing       = 'border-box';
      crossHElem.style.backgroundColor = crossColor;

      crossPosElem.style.position        = 'absolute';
      crossPosElem.style.fontSize        = '12px';
      crossPosElem.style.textAlign       = 'center';
      crossPosElem.style.boxSizing       = 'border-box';
      crossPosElem.style.padding         = '0 10px';
      crossPosElem.style.height          = '26px';
      crossPosElem.style.lineHeight      = '26px';
      crossPosElem.style.borderRadius    = '15px';
      crossPosElem.style.color           = crossColor;
      crossPosElem.style.backgroundColor = 'rgba(0,0,0,0.8)';

      crossWrapElem.appendChild(crossVElem);
      crossWrapElem.appendChild(crossHElem);
      crossWrapElem.appendChild(crossPosElem);
    }

    if (!crossWrapElem.parentNode) {
      cropWrapElem.appendChild(crossWrapElem);
    }
  }


  // auto scroll
  // -----------

  var scrollDist  = 50;
  var scrollSense = 5;
  var scrollDelay = 50;
  var scrollTimer;

  function stopScrollTimer() {
    if (scrollTimer) {
      clearTimeout(scrollTimer);
      scrollTimer = 0;
    }
  }


  handler.captureRegion = function () {

    ensureCropElements();
    updateCropElements();

    window.addEventListener('resize', onWindowResize, false);
    document.body.addEventListener('keydown', onCropKeyDown, false);

    bindCrossLine();
  };

  function updateCropElements(bounds) {

    var dSize  = getDocumentSize();
    var bounds = bounds || getCropBounds();

    cropWrapElem.style.width  = dSize.width + 'px';
    cropWrapElem.style.height = dSize.height + 'px';

    if (bounds.width > 0 && bounds.height > 0) {

      cropWrapElem.style.backgroundColor = bgTransparent;

      cropTopElem.style.width  = bounds.left + bounds.width + 'px';
      cropTopElem.style.height = bounds.top + 'px';

      cropRightElem.style.width  = dSize.width - bounds.left - bounds.width + 'px';
      cropRightElem.style.height = bounds.top + bounds.height + 'px';

      cropBottomElem.style.width  = dSize.width - bounds.left + 'px';
      cropBottomElem.style.height = dSize.height - bounds.top - bounds.height + 'px';

      cropLeftElem.style.width  = bounds.left + 'px';
      cropLeftElem.style.height = dSize.height - bounds.top + 'px';

      cropCenterElem.style.top    = bounds.top + 'px';
      cropCenterElem.style.left   = bounds.left + 'px';
      cropCenterElem.style.width  = bounds.width + 'px';
      cropCenterElem.style.height = bounds.height + 'px';

      cropAntLineElem.innerHTML = createAntLine(dSize.width, dSize.height, bounds.width, bounds.height, false, false);

      if (resizeWrap) {
        resizeWrap.style.display = '';
      }

    } else {

      cropWrapElem.style.backgroundColor = bgColor;

      cropTopElem.style.width  = 0;
      cropTopElem.style.height = 0;

      cropRightElem.style.width  = 0;
      cropRightElem.style.height = 0;

      cropBottomElem.style.width  = 0;
      cropBottomElem.style.height = 0;

      cropLeftElem.style.width  = 0;
      cropLeftElem.style.height = 0;

      cropCenterElem.style.top    = 0;
      cropCenterElem.style.left   = 0;
      cropCenterElem.style.width  = 0;
      cropCenterElem.style.height = 0;

      cropAntLineElem.innerHTML = '';

      if (resizeWrap) {
        resizeWrap.style.display = 'none';
      }
    }
  }

  function getCropBounds() {

    return {
      top: parseInt(cropCenterElem.style.top, 10),
      left: parseInt(cropCenterElem.style.left, 10),
      width: cropCenterElem.offsetWidth || cropCenterElem.clientWidth,
      height: cropCenterElem.offsetHeight || cropCenterElem.clientHeight
    };
  }

  function onWindowResize() {
    updateCropElements();
  }

  function onCropKeyDown(e) {

    switch (e.keyCode) {

      case 13: // enter

        var bounds = getCropBounds();
        if (bounds.width > 0 && bounds.height > 0) {

          captureCrop();

        } else {

          var x = document.body.scrollLeft + document.documentElement.clientWidth / 2;
          var y = document.body.scrollTop + document.documentElement.clientHeight / 2;

          createDemoCrop(x, y);
          clearCrossLine();
          ensureStyle();
          bindCenter();
          bindController();

        }
        break;

      case 27: // esc
        clearCaptureCrop();
        break;

      default:
        break;
    }
  }

  function clearCaptureCrop() {

    clearCrossLine();
    clearController();
    clearCrop();
    clearStyle();

    window.removeEventListener('resize', onWindowResize, false);
    document.body.removeEventListener('keydown', onCropKeyDown, false);
  }

  function bindCrossLine() {
    document.body.addEventListener('mousemove', updateCrossLine, false);
    document.body.addEventListener('mousedown', onCropMouseDown, false);
  }

  function unBindCrossLine() {
    document.body.removeEventListener('mousemove', updateCrossLine, false);
    document.body.removeEventListener('mousedown', onCropMouseDown, false);
  }

  function updateCrossLine(e) {

    ensureCrossLine();
    stopScrollTimer();
    placeCrossLine(e.pageX, e.pageY);
    autoScrollCrossLine(e.pageX, e.pageY);
  }

  function clearCrossLine() {

    stopScrollTimer();

    crossVElem.style.left  = '-1px';
    crossHElem.style.top   = '-1px';
    crossPosElem.innerText = '';

    removeElement(crossWrapElem);
    unBindCrossLine();
  }

  function placeCrossLine(pageX, pageY) {

    crossVElem.style.left = Math.max(pageX - 1, 0) + 'px';
    crossHElem.style.top  = Math.max(pageY - 1, 0) + 'px';

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
  }

  function autoScrollCrossLine(pageX, pageY) {

    if (isBodyScrollable()) {

      var body    = document.body;
      var docElem = document.documentElement;

      var clientWidth  = docElem.clientWidth;
      var clientHeight = docElem.clientHeight;
      var scrollWidth  = docElem.scrollWidth;
      var scrollHeight = docElem.scrollHeight;

      var scrollTop  = body.scrollTop;
      var scrollLeft = body.scrollLeft;

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

        placeCrossLine(pageX, pageY);

        scrollTimer = setTimeout(function () {
          autoScrollCrossLine(pageX, pageY);
        }, scrollDelay);
      }
    }
  }


  var mouseDownTimer;
  var mouseDownDelay = 200;
  var isMouseDown    = false;
  var clickCount     = 0;

  var startX = 0;
  var startY = 0;
  var lastX  = 0;
  var lastY  = 0;

  function onCropMouseDown(e) {

    e.preventDefault();

    clearCrossLine();

    document.body.addEventListener('mousemove', onCropMouseMove, false);
    document.body.addEventListener('mouseup', onCropMouseUp, false);

    isMouseDown = false;
    startX      = e.pageX;
    startY      = e.pageY;

    mouseDownTimer = setTimeout(function () {
      isMouseDown = true;
    }, mouseDownDelay);
  }

  function onCropMouseMove(e) {

    e.preventDefault();

    stopScrollTimer();

    isMouseDown = true;

    var pageX = e.pageX;
    var pageY = e.pageY;

    updateCropElements({
      left: Math.min(pageX, startX),
      top: Math.min(pageY, startY),
      width: Math.abs(pageX - startX),
      height: Math.abs(pageY - startY),
    });

    autoScrollCrop(pageX, pageY);
  }

  function onCropMouseUp(e) {

    stopScrollTimer();

    document.body.removeEventListener('mousemove', onCropMouseMove, false);
    document.body.removeEventListener('mouseup', onCropMouseUp, false);

    if (!isMouseDown) {
      clearTimeout(mouseDownTimer);
      // create a crop when click
      createDemoCrop(e.pageX, e.pageY);
    }

    var bounds = getCropBounds();
    if (bounds.width && bounds.height) {
      ensureStyle();
      bindCenter();
      bindController();
    } else {
      bindCrossLine();
      updateCrossLine(e);
    }
  }

  function autoScrollCrop(pageX, pageY) {

    if (isBodyScrollable()) {

      var body    = document.body;
      var docElem = document.documentElement;

      var clientWidth  = docElem.clientWidth;
      var clientHeight = docElem.clientHeight;
      var scrollWidth  = docElem.scrollWidth;
      var scrollHeight = docElem.scrollHeight;

      var scrollTop  = body.scrollTop;
      var scrollLeft = body.scrollLeft;

      var scrolled = false;

      var bounds = getCropBounds();
      var left   = bounds.left;
      var top    = bounds.top;
      var width  = bounds.width;
      var height = bounds.height;

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

        updateCropElements({
          top: top,
          left: left,
          width: width,
          height: height
        });

        scrollTimer = setTimeout(function () {
          autoScrollCrop(pageX, pageY);
        }, scrollDelay);
      }
    }
  }

  function createDemoCrop(x, y) {

    var size = 200;

    var scrollLeft   = document.body.scrollLeft;
    var scrollTop    = document.body.scrollTop;
    var clientWidth  = document.documentElement.clientWidth;
    var clientHeight = document.documentElement.clientHeight;

    updateCropElements({
      left: clamp(x - size / 2, scrollLeft, scrollLeft + clientWidth - size),
      top: clamp(y - size / 2, scrollTop, scrollTop + clientHeight - size),
      width: size,
      height: size
    });
  }


  var resizeWrap;
  var btnResizeNW;
  var btnResizeN;
  var btnResizeNE;
  var btnResizeW;
  var btnResizeE;
  var btnResizeSW;
  var btnResizeS;
  var btnResizeSE;
  var btnResizeTop;
  var btnResizeRight;
  var btnResizeBottom;
  var btnResizeLeft;

  var btnResizeColor1 = 'rgba(0,170,238,0.9)';
  var btnResizeColor2 = 'rgba(0,170,238,0.6)';

  var handleNWMouseDown;
  var handleNMouseDown;
  var handleNEMouseDown;
  var handleWMouseDown;
  var handleEMouseDown;
  var handleSWMouseDown;
  var handleSMouseDown;
  var handleSEMouseDown;

  function ensureController() {

    if (!resizeWrap) {
      resizeWrap      = document.createElement('div');
      btnResizeNW     = document.createElement('div');
      btnResizeN      = document.createElement('div');
      btnResizeNE     = document.createElement('div');
      btnResizeW      = document.createElement('div');
      btnResizeE      = document.createElement('div');
      btnResizeSW     = document.createElement('div');
      btnResizeS      = document.createElement('div');
      btnResizeSE     = document.createElement('div');
      btnResizeTop    = document.createElement('div');
      btnResizeRight  = document.createElement('div');
      btnResizeBottom = document.createElement('div');
      btnResizeLeft   = document.createElement('div');

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
      innerElem.style.backgroundColor = btnResizeColor2;
      innerElem.style.boxShadow       = '0 0 6px 0px rgba(255,255,255,0.6)';

      [
        btnResizeNW, btnResizeN, btnResizeNE,
        btnResizeW, btnResizeE,
        btnResizeSW, btnResizeS, btnResizeSE
      ].forEach(function (elem) {
        elem.style.position     = 'absolute';
        elem.style.width        = '19px';
        elem.style.height       = '19px';
        elem.style.borderRadius = '19px';
        elem.style.border       = '3px solid ' + btnResizeColor1;
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

      handleNWMouseDown = onControllerMouseDown.bind(null, 1);
      handleNMouseDown  = onControllerMouseDown.bind(null, 2);
      handleNEMouseDown = onControllerMouseDown.bind(null, 3);
      handleEMouseDown  = onControllerMouseDown.bind(null, 4);
      handleSEMouseDown = onControllerMouseDown.bind(null, 5);
      handleSMouseDown  = onControllerMouseDown.bind(null, 6);
      handleSWMouseDown = onControllerMouseDown.bind(null, 7);
      handleWMouseDown  = onControllerMouseDown.bind(null, 8);
    }

    if (!resizeWrap.parentNode) {
      cropCenterElem.appendChild(resizeWrap);
    }
  }

  function bindCenter() {
    cropCenterElem.addEventListener('mousedown', onCenterMouseDown, false);
  }

  function unBindCenter() {
    cropCenterElem.removeEventListener('mousedown', onCenterMouseDown, false);
  }

  function clearCrop() {

    removeElement(cropWrapElem);
    updateCropElements({
      left: 0,
      top: 0,
      width: 0,
      height: 0
    });
    unBindCenter();
  }

  function bindController() {

    ensureController();

    btnResizeNW.addEventListener('mousedown', handleNWMouseDown, false);
    btnResizeN.addEventListener('mousedown', handleNMouseDown, false);
    btnResizeNE.addEventListener('mousedown', handleNEMouseDown, false);
    btnResizeE.addEventListener('mousedown', handleEMouseDown, false);
    btnResizeSE.addEventListener('mousedown', handleSEMouseDown, false);
    btnResizeS.addEventListener('mousedown', handleSMouseDown, false);
    btnResizeSW.addEventListener('mousedown', handleSWMouseDown, false);
    btnResizeW.addEventListener('mousedown', handleWMouseDown, false);

    btnResizeTop.addEventListener('mousedown', handleNMouseDown, false);
    btnResizeRight.addEventListener('mousedown', handleEMouseDown, false);
    btnResizeBottom.addEventListener('mousedown', handleSMouseDown, false);
    btnResizeLeft.addEventListener('mousedown', handleWMouseDown, false);
  }

  function unBindController() {

    if (resizeWrap) {
      btnResizeNW.removeEventListener('mousedown', handleNWMouseDown, false);
      btnResizeN.removeEventListener('mousedown', handleNMouseDown, false);
      btnResizeNE.removeEventListener('mousedown', handleNEMouseDown, false);
      btnResizeE.removeEventListener('mousedown', handleEMouseDown, false);
      btnResizeSE.removeEventListener('mousedown', handleSEMouseDown, false);
      btnResizeS.removeEventListener('mousedown', handleSMouseDown, false);
      btnResizeSW.removeEventListener('mousedown', handleSWMouseDown, false);
      btnResizeW.removeEventListener('mousedown', handleWMouseDown, false);

      btnResizeTop.removeEventListener('mousedown', handleNMouseDown, false);
      btnResizeRight.removeEventListener('mousedown', handleEMouseDown, false);
      btnResizeBottom.removeEventListener('mousedown', handleSMouseDown, false);
      btnResizeLeft.removeEventListener('mousedown', handleWMouseDown, false);
    }

  }

  function clearController() {

    removeElement(resizeWrap);
    unBindController();
  }


  var currentController;
  var cropBounds;

  function onCenterMouseDown(e) {

    e.preventDefault();

    document.body.addEventListener('mousemove', onCenterMouseMove, false);
    document.body.addEventListener('mouseup', onCenterMouseUp, false);

    startX = e.pageX;
    startY = e.pageY;
    lastX  = startX;
    lastY  = startY;

    cropBounds = getCropBounds();


    // mock double click
    // -----------------

    isMouseDown = false;

    if (mouseDownTimer) {
      clearTimeout(mouseDownTimer);
    }

    mouseDownTimer = setTimeout(function () {
      isMouseDown = true;
      clickCount  = 0;
    }, mouseDownDelay);
  }

  function onCenterMouseMove(e) {

    e.preventDefault();

    isMouseDown = true;
    clickCount  = 0;

    stopScrollTimer();

    var bounds = {
      width: cropBounds.width,
      height: cropBounds.height
    };

    var left = cropBounds.left + e.pageX - startX;
    var top  = cropBounds.top + e.pageY - startY;

    bounds.left = clamp(left, 0, document.documentElement.scrollWidth - cropBounds.width);
    bounds.top  = clamp(top, 0, document.documentElement.scrollHeight - cropBounds.height);

    updateCropElements(bounds);

    var dx = e.pageX - lastX;
    var dy = e.pageY - lastY;

    lastX = e.pageX;
    lastY = e.pageY;

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

    autoScrollMovement(direction);
  }

  function onCenterMouseUp() {

    // mock double click
    // -----------------

    if (!isMouseDown) {
      clickCount++;
      clearTimeout(mouseDownTimer);
    }

    if (clickCount === 1) {
      mouseDownTimer = setTimeout(function () {
        isMouseDown = false;
        clickCount  = 0;
      }, mouseDownDelay);
    }

    if (clickCount === 2) {
      clickCount = 0;
      captureCrop();
    } else {
      stopScrollTimer();
    }

    document.body.removeEventListener('mousemove', onCenterMouseMove, false);
    document.body.removeEventListener('mouseup', onCenterMouseUp, false);
  }

  function autoScrollMovement(direction) {

    if (isBodyScrollable()) {

      var body    = document.body;
      var docElem = document.documentElement;

      var clientWidth  = docElem.clientWidth;
      var clientHeight = docElem.clientHeight;
      var scrollWidth  = docElem.scrollWidth;
      var scrollHeight = docElem.scrollHeight;

      var scrollTop  = body.scrollTop;
      var scrollLeft = body.scrollLeft;

      var cropWidth  = cropBounds.width;
      var cropHeight = cropBounds.height;
      var cropLeft   = parseInt(cropCenterElem.style.left, 10);
      var cropTop    = parseInt(cropCenterElem.style.top, 10);

      var xOverflow = cropWidth > clientWidth;
      var yOverflow = cropHeight > clientHeight;

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

        updateCropElements({
          top: cropTop,
          left: cropLeft,
          width: cropWidth,
          height: cropHeight
        });

        scrollTimer = setTimeout(function () {
          autoScrollMovement(direction);
        }, scrollDelay);
      }
    }
  }

  function onControllerMouseDown(controller, e) {

    e.preventDefault();
    e.stopPropagation();

    currentController = controller;

    document.body.addEventListener('mousemove', onControllerMouseMove, false);
    document.body.addEventListener('mouseup', onControllerMouseUp, false);

    startX = e.pageX;
    startY = e.pageY;
    lastX  = startX;
    lastY  = startY;

    cropBounds = getCropBounds();
  }

  function onControllerMouseMove(e) {

    e.preventDefault();

    stopScrollTimer();

    var dx = e.pageX - startX;
    var dy = e.pageY - startY;

    var top    = cropBounds.top;
    var left   = cropBounds.left;
    var right  = left + cropBounds.width;
    var bottom = top + cropBounds.height;

    switch (currentController) {

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

    updateCropElements({
      top: Math.min(top, bottom),
      left: Math.min(left, right),
      width: Math.abs(left - right),
      height: Math.abs(top - bottom)
    });

    autoScrollController(e.pageX, e.pageY);
  }

  function onControllerMouseUp(e) {

    currentController = 0;

    stopScrollTimer();

    document.body.removeEventListener('mousemove', onControllerMouseMove, false);
    document.body.removeEventListener('mouseup', onControllerMouseUp, false);

    var bounds = getCropBounds();
    if (!bounds.width || !bounds.height) {
      clearController();
      unBindCenter();
      bindCrossLine();
      updateCrossLine(e);
    }
  }

  function autoScrollController(pageX, pageY) {

    if (isBodyScrollable()) {

      var body    = document.body;
      var docElem = document.documentElement;

      var clientWidth  = docElem.clientWidth;
      var clientHeight = docElem.clientHeight;
      var scrollWidth  = docElem.scrollWidth;
      var scrollHeight = docElem.scrollHeight;

      var scrollTop  = body.scrollTop;
      var scrollLeft = body.scrollLeft;

      var bounds = getCropBounds();
      var top    = bounds.top;
      var left   = bounds.left;
      var right  = left + bounds.width;
      var bottom = top + bounds.height;

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

        updateCropElements({
          top: Math.min(top, bottom),
          left: Math.min(left, right),
          width: Math.abs(left - right),
          height: Math.abs(top - bottom)
        });

        scrollTimer = setTimeout(function () {
          autoScrollController(pageX, pageY);
        }, scrollDelay);
      }
    }
  }

  function captureCrop() {

    fragments  = null;
    targetElem = cropCenterElem;

    prepareFragments();
    clearCaptureCrop();

    handler.nextFragment();
  }


  var targetElem;
  var overlayElem;
  var outlineElem;

  function ensureOverlay() {

    if (!overlayElem) {

      overlayElem = document.createElement('div');

      overlayElem.style.pointerEvents = 'none';
      overlayElem.style.position      = 'absolute';
      overlayElem.style.left          = '0';
      overlayElem.style.top           = '0';

      outlineElem = document.createElement('div');

      outlineElem.style.position = 'absolute';
      outlineElem.style.zIndex   = zIndex;

      overlayElem.appendChild(outlineElem);
    }

    var docSize = getDocumentSize();

    overlayElem.style.width  = docSize.width + 'px';
    overlayElem.style.height = docSize.height + 'px';

    if (!overlayElem.parentNode) {
      document.body.appendChild(overlayElem);
    }
  }

  function removeOverlay() {

    removeElement(overlayElem);

    if (outlineElem) {
      outlineElem.innerHTML    = '';
      outlineElem.style.top    = '0px';
      outlineElem.style.left   = '0px';
      outlineElem.style.width  = '0px';
      outlineElem.style.height = '0px';
    }
  }

  handler.captureEntire = function () {
    targetElem = document.documentElement;
    handler.nextFragment();
  };

  function updateAntLine(e) {

    if (targetElem !== e.target) {

      targetElem = e.target;

      var dSize  = getDocumentSize();
      var bounds = getBounds(targetElem);

      var top    = Math.max(document.body.scrollTop + bounds.top - strokeWidth, 0);
      var left   = Math.max(document.body.scrollLeft + bounds.left - strokeWidth, 0);
      var width  = Math.min(dSize.width, bounds.width + 2 * strokeWidth);
      var height = Math.min(dSize.height, bounds.height + 2 * strokeWidth);

      outlineElem.style.top    = top + 'px';
      outlineElem.style.left   = left + 'px';
      outlineElem.style.width  = width + 'px';
      outlineElem.style.height = height + 'px';

      outlineElem.innerHTML = createAntLine(dSize.width, dSize.height, bounds.width, bounds.height, true, true);
    }
  }

  function clearAntLine() {

    removeOverlay();
    clearStyle();

    document.body.removeEventListener('mousemove', updateAntLine, false);
    document.body.removeEventListener('mousedown', captureElement, false);
    document.body.removeEventListener('keydown', onShortCutKey, false);
  }

  function onShortCutKey(e) {

    switch (e.keyCode) {

      case 13: // enter
        captureElement();
        break;

      case 27: // esc
        clearAntLine();
        targetElem = null;
        break;

      default:
        break;
    }
  }

  function captureElement() {
    clearAntLine();
    handler.nextFragment();
  }

  handler.captureElement = function () {

    ensureStyle();
    ensureOverlay();

    document.body.addEventListener('mousemove', updateAntLine, false);
    document.body.addEventListener('mousedown', captureElement, false);
    document.body.addEventListener('keydown', onShortCutKey, false);
  };


  var delay        = 200;
  var fragments    = null;
  var needScroll   = false;
  var savedStates  = null;
  var scrollParent = null;

  var originOverflow;
  var originScrollTop;
  var originScrollLeft;

  var targetTop;
  var targetLeft;
  var startScrollTop;
  var startScrollLeft;

  handler.nextFragment = function () {

    if (!fragments) {
      prepareFragments();
    }

    if (fragments.length) {

      var next = fragments.shift();

      if (needScroll) {

        scrollParent.scrollTop  = next.dy + startScrollTop;
        scrollParent.scrollLeft = next.dx + startScrollLeft;

        next.sx = scrollParent.scrollLeft < next.dx + startScrollLeft
          ? targetLeft + next.dx + startScrollLeft - scrollParent.scrollLeft
          : targetLeft;

        next.sy = scrollParent.scrollTop < next.dy + startScrollTop
          ? targetTop + next.dy + startScrollTop - scrollParent.scrollTop
          : targetTop;
      }

      setTimeout(function () {
        chrome.runtime.sendMessage({ action: 'onFragment', fragment: next });
      }, delay);

    } else {

      if (needScroll) {
        restoreScrollBar();
      }

      restoreViewports();

      fragments    = null;
      targetElem   = null;
      scrollParent = null;

      chrome.runtime.sendMessage({ action: 'onCaptureEnd' });
    }
  }

  function prepareFragments() {

    scrollParent = isBody(targetElem)
      ? targetElem.ownerDocument.body
      : getScrollParent(targetElem);

    adjustViewports();
    collectFragments();

    needScroll = fragments.length > 1;

    if (needScroll) {
      var bounds = getBounds(targetElem);

      targetTop       = bounds.top;
      targetLeft      = bounds.left;
      startScrollTop  = scrollParent.scrollTop;
      startScrollLeft = scrollParent.scrollLeft;
    }
  }

  function collectFragments() {

    var ratio = window.devicePixelRatio;

    fragments = [];

    if (isOverflow(targetElem, scrollParent)) { // scroll capture

      hideScrollBar();

      // the screen capture size
      var tSize       = getElementSize(targetElem);
      var totalWidth  = tSize.width;
      var totalHeight = tSize.height;

      // viewport size
      var vSize  = getViewportSize(scrollParent);
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
            ratio: ratio
          });

          xPos += xDelta;
        }

        yPos += yDelta;
      }

    } else { // normal capture

      var bounds = getBounds(targetElem);

      fragments.push({
        sx: bounds.left,
        sy: bounds.top,
        dx: 0,
        dy: 0,
        width: bounds.width,
        height: bounds.height,
        totalWidth: bounds.width,
        totalHeight: bounds.height,
        ratio: ratio
      });
    }
  }

  function hideScrollBar() {

    // save parent's status
    originOverflow   = scrollParent.style.overflow;
    originScrollTop  = scrollParent.scrollTop;
    originScrollLeft = scrollParent.scrollLeft;

    // disable all scrollBars, restore it when captured
    scrollParent.style.overflow = 'hidden';
  }

  function restoreScrollBar() {

    // restore the parent's scrollBar
    scrollParent.style.overflow = originOverflow;
    scrollParent.scrollTop      = originScrollTop;
    scrollParent.scrollLeft     = originScrollLeft;
  }

  function adjustViewports() {

    savedStates = [];

    if (isOverflow(targetElem, scrollParent)) {

      savedStates.push({
        element: scrollParent,
        scrollTop: scrollParent.scrollTop,
        scrollLeft: scrollParent.scrollLeft
      });

      if (isBody(scrollParent)) {

        var bounds = getBounds(targetElem);

        scrollParent.scrollTop += bounds.top;
        scrollParent.scrollLeft += bounds.left;
      } else {

        var offset = getOffset(targetElem, scrollParent);

        scrollParent.scrollTop  = offset.top;
        scrollParent.scrollLeft = offset.left;
      }
    }

    var vSize  = getViewportSize(targetElem.ownerDocument.body);
    var parent = scrollParent;

    while (!isBody(parent)) {

      var top  = 0;
      var left = 0;

      var pBounds = getBounds(parent);
      var tBounds = getBounds(targetElem);

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

        var container = getScrollParent(parent);

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

    console.log(savedStates);
  }

  function restoreViewports() {

    savedStates && savedStates.forEach(function (state) {
      var elem = state.element;

      elem.scrollTop  = state.scrollTop;
      elem.scrollLeft = state.scrollLeft;
    });

    savedStates = null;
  }


  // helpers
  // -------

  function clamp(value, min, max) {
    return min < max
      ? (value < min ? min : value > max ? max : value)
      : (value < max ? max : value > min ? min : value);
  }

  function max(numbers) {
    return Math.max.apply(Math, numbers.filter(function (x) { return x; }));
  }

  function isBody(elem) {

    return elem === document
      || elem === document.body
      || elem === document.documentElement;
  }

  function isOverflow(elem, parent) {

    var bounds = getBounds(elem);

    // parent is body
    if (isBody(parent)) {

      if (bounds.left < 0 || bounds.top < 0) {
        return true;
      }

      var vSize = getViewportSize(parent);

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

    var offset = getOffset(elem, parent);

    return bounds.width + offset.left - parent.scrollLeft > parent.clientWidth
      || bounds.height + offset.top - parent.scrollTop > parent.clientHeight;
  }

  function getElementSize(elem) {

    return isBody(elem)
      ? getDocumentSize(elem.ownerDocument)
      : {
      width: max([elem.offsetWidth, elem.clientWidth]),
      height: max([elem.offsetHeight, elem.clientHeight])
    };
  }

  function getDocumentSize(doc) {

    doc = doc || document;

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

  function getViewportSize(elem) {

    elem = isBody(elem) ? elem.ownerDocument.documentElement : elem;

    return {
      width: elem.clientWidth,
      height: elem.clientHeight
    }
  }

  function getOffset(elem, relativeElem) {

    var top  = 0;
    var left = 0;

    var computedStyle    = getComputedStyle(relativeElem);
    var computedPosition = computedStyle.getPropertyValue('position');
    var inlinePosition   = '';

    if (computedPosition === 'static') {
      inlinePosition = relativeElem.style.position;

      relativeElem.style.position = 'relative';
    }

    while (elem && elem !== relativeElem) {
      top += elem.offsetTop;
      left += elem.offsetLeft;

      elem = elem.offsetParent;
    }

    relativeElem.style.position = inlinePosition;

    return {
      left: left,
      top: top
    };
  }

  function getBounds(elem) {

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

    if (typeof bounds.width === 'undefined') {
      bounds.width = document.body.scrollWidth - bounds.left - bounds.right;
    }
    if (typeof bounds.height === 'undefined') {
      bounds.height = document.body.scrollHeight - bounds.top - bounds.bottom;
    }

    bounds.top    = bounds.top - docEle.clientTop;
    bounds.left   = bounds.left - docEle.clientLeft;
    bounds.right  = doc.body.clientWidth - bounds.width - bounds.left;
    bounds.bottom = doc.body.clientHeight - bounds.height - bounds.top;

    return bounds;
  }

  function getScrollParent(elem) {

    // In firefox if the el is inside an iframe with display: none;
    // window.getComputedStyle() will return null;
    // https://bugzilla.mozilla.org/show_bug.cgi?id=548397

    var computedStyle = getComputedStyle(elem) || {};
    var position      = computedStyle.position;

    if (position === 'fixed') {
      return elem;
    }

    var parent = elem;

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

  function removeElement(elem) {
    if (elem && elem.parentNode) {
      elem.parentNode.removeChild(elem);
    }
  }

  function isBodyScrollable() {

    var docElem = document.documentElement;
    return docElem.scrollWidth > docElem.clientWidth || docElem.scrollHeight > docElem.clientHeight;
  }

})();


// message
// -------

// received message from background
chrome.runtime.onMessage.addListener(function (message, sender) {
  if (sender && sender.id === chrome.runtime.id) {
    var action = message.action;
    if (action && handler[action]) {
      handler[action]();
    }
  }
});
