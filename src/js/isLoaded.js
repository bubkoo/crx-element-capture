// check content scripts

chrome.runtime.sendMessage({
  action: window.isContentScriptLoaded ? 'onContentReady' : 'injectContentScript'
});

