var STAR_URL = 'https://ghbtns.com/github-btn.html?user=bubkoo&repo=crx-screen-grabber&type=star&count=true';


var bgWindow = chrome.extension.getBackgroundPage();
var handler  = bgWindow.handler;

function i18n() {}

function initFooter() {
  setTimeout(function () {
    $('#git-stars').attr('src', STAR_URL);
  }, 500);
}

$(function () {

  i18n();
  initFooter();

  $('.capture-menu').on('click', 'li', function () {

    var method = this.id;
    if (method && handler[method]) {
      handler[method]();
    }

    window.close();
  });
});
