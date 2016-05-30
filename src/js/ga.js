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

})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');


ga('create', 'UA-78428859-1', 'auto');
ga('send', 'pageview');
