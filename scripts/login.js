window.onload = () => {
  chrome.storage.local.get(["token"], function(preAuthToken) {
    if (!(Object.entries(preAuthToken).length === 0 && preAuthToken.constructor === Object)) {
      chrome.browserAction.setPopup({popup: "html/menu.html"}, () => window.location.href = "menu.html");
    }

    document.querySelector("#login").addEventListener('click', () => {
      new Promise((resolve, reject) => chrome.identity.getAuthToken({interactive: true}, (token) => resolve(token)))
      .then((token) => {
        console.log('Logged in');
        return new Promise((resolve, reject) => chrome.storage.local.set({ "token": token }, (token) => resolve(token)));
      })
      .then(() => new Promise((resolve) => {
        chrome.storage.local.get(["token", "userInfo"], (items) => resolve(items));
      }))
      .then((storage) => {
        return fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${storage.token}`)
        .then((response) => response.json())
        .then((userInfo) => chrome.storage.local.set({ "userInfo": userInfo }));
      })
      .then(() => chrome.browserAction.setPopup({popup: "html/login.html"}, () => window.location.href = "login.html"));
    });
  });
};