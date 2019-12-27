window.onload = function() {
  var logButton = document.querySelector("#log");
  
  chrome.identity.getAuthToken({interactive: false}, function(token) {
    if (!token) {
      /*logButton.value = "Sign out";
      logButton.addEventListener('click', function() {
        window
          .fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
          .then((response) => {
            chrome.identity.removeCachedAuthToken({ token: localStorage.getItem('token') }, function() {
              localStorage.removeItem('token');
            });
            console.log('Logged out');
            chrome.pageAction.setPopup({tabId: 0, popup: "menu.html"});

            return response;
          });
      });
    } else {*/
      logButton.value = "Sign in";
      logButton.addEventListener('click', function() {
        chrome.identity.getAuthToken({interactive: true}, function(token) {
          localStorage.setItem('token', token);
          console.log('Logged in');
          chrome.browserAction.setPopup({popup: "html/login.html"});
          window.location.href = "login.html";
        });
      });
    } else {
      console.log("Token found");
      localStorage.setItem('token', token);
      chrome.browserAction.setPopup({popup: "html/menu.html"});
      window.location.href = "menu.html";
    }
  });
};