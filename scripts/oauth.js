window.onload = function() {
  var authTitle = document.querySelector("#auth-title");
  var logButton = document.querySelector("#log");
  
  chrome.identity.getAuthToken({interactive: false}, function(token) {    
    localStorage.setItem('token', token);

    if (token) {
      authTitle.classList.add("hide");
      logButton.value = "Sign out";
      logButton.addEventListener('click', function() {
        window.fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
        chrome.identity.removeCachedAuthToken({ token: localStorage.getItem('token') }, function() {
          localStorage.removeItem('token');
          console.log('Logged out');
          setTimeout(() => window.location.reload(), 2000);
        });
      });
    } else {
      authTitle.classList.remove("hide");
      logButton.value = "Sign in";
      logButton.addEventListener('click', function() {
        chrome.identity.getAuthToken({interactive: true}, function(token) {
          localStorage.setItem('token', token);
          window.location.reload();
        });
      });
    }
  });
};