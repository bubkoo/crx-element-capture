var bgWindow = chrome.extension.getBackgroundPage();
var handler  = bgWindow.handler;

function i18n() {}

$(function () {

  i18n();

  $('.capture-menu').on('click', 'li', function () {

    var method = this.id;
    if (method && handler[method]) {
      handler[method]();
    }

    window.close();
  });
});
