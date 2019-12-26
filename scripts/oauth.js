window.onload = function() {
  var logButton = document.querySelector("#log");
  
  chrome.identity.getAuthToken({interactive: false}, function(token) {    
    localStorage.setItem('token', token);

    if (token) {
      logButton.innerHTML = "Sign out";
      logButton.addEventListener('click', function() {
        window.fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
        chrome.identity.removeCachedAuthToken({ token: localStorage.getItem('token') }, function() {
          localStorage.removeItem('token');
          console.log('Logged out');
        });
        window.location.reload();
      });
    } else {
      logButton.innerHTML = "Sign in";
      logButton.addEventListener('click', function() {
        chrome.identity.getAuthToken({interactive: true}, function(token) {
          localStorage.setItem('token', token);
          window.location.reload();
        });
      });
    }
  });
};