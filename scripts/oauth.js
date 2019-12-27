window.onload = function() {
  var loginButton = document.querySelector("#login");
  
  chrome.identity.getAuthToken({interactive: false}, function(token) {
    if (!token) {
      loginButton.addEventListener('click', function() {
        chrome.identity.getAuthToken({interactive: true}, function(token) {
          console.log('Logged in');
          chrome.storage.local.set({ "token": token });
          chrome.browserAction.setPopup({popup: "html/login.html"});
          window.location.href = "login.html";
        });
      });
    } else {
      console.log("Token found");
      chrome.storage.local.set({ "token": token });
      chrome.browserAction.setPopup({popup: "html/menu.html"});
      window.location.href = "menu.html";
    }
  });
};