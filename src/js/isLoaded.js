// check content scripts
chrome.extension.sendRequest({
  action: window.isContentScriptLoaded ? '' : 'injectContentScript'
});

