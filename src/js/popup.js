var bgWindow   = chrome.extension.getBackgroundPage();
var screenShot = bgWindow.screenShot;

function i18n() {}


$(function () {

  i18n();

  $('.capture-menu').on('click', 'li', function () {

    var method = this.id;
    if (method && screenShot[method]) {
      screenShot[method]();
    }

    window.close();
  });
});
