window.onload = () => {
  chrome.storage.local.get(["token"], function(preAuthToken) {
    if (!(Object.entries(preAuthToken).length === 0 && preAuthToken.constructor === Object)) {
      chrome.browserAction.setPopup({popup: "html/menu.html"}, () => window.location.href = "menu.html");
    }

    document.querySelector("#login").addEventListener('click', () => {
      new Promise((resolve, reject) => chrome.identity.getAuthToken({interactive: true}, (token) => resolve(token)))
      .then((token) => {
        console.log('Logged in');
        chrome.storage.local.set({ "token": token });
          
        return new Promise((resolve, reject) => chrome.browserAction.setPopup({popup: "html/login.html"}, () => resolve()));
      })
      .then(() => window.location.href = "login.html");
    });
  });
};