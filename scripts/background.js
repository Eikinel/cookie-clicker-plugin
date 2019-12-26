chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'orteil.dashnet.org', schemes: ['http', 'https'] }
      })
      ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
  });
});