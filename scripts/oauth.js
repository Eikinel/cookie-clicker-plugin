window.onload = function() {
  var login = document.getElementById("login")
  
  login.addEventListener('click', function() {
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      console.log(token);
    });
  });
};