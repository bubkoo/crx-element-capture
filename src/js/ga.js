// add analytics.js
(function (window, document, tagName, src, ga) {

  window['GoogleAnalyticsObject'] = ga;

  if (!window[ga]) {
    window[ga] = function () {
      (window[ga].q = window[ga].q || []).push(arguments);
    };
  }

  window[ga].l = 1 * new Date();

  var script = document.createElement(tagName);
  var first  = document.getElementsByTagName(tagName)[0];

  script.async = true;
  script.src   = src;

  first.parentNode.insertBefore(script, first);

})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

(function () {

  var handlers = {

    '/popup.html': function () {

      // capture buttons
      $('.capture-menu').on('click', 'li', function () {
        ga('send', {
          hitType: 'event',
          eventCategory: 'popup',
          eventAction: 'capture',
          eventLabel: this.id
        });
      });

      // stars
      $('#git-stars').on('click', function () {
        ga('send', {
          hitType: 'social',
          socialNetwork: 'github',
          socialAction: 'star',
          socialTarget: STAR_URL
        });
      });
    },

    '/editor.html': function () {

    },

    '/options.html': function () {

    }
  };

  var pathname = window.location.pathname;
  var handler  = handlers[pathname];

  ga('create', 'UA-78428859-1', 'auto');
  ga('send', 'pageview', pathname);

  if (handler) {
    handler();
  }

})();


