window.onload = () => {
  //getAuthToken().then((t) => logout(t));

  getAuthToken().then((preAuthToken) => {
    if (preAuthToken) {
      return switchFrame("menu");
    }
  })
  .catch(() => {});

  document.querySelector("#login").addEventListener('click', () => {
    new Promise((resolve, reject) => chrome.identity.getAuthToken({interactive: true}, (token) => resolve(token)))
    .then((token) => {
      console.log(token);
      return fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`)
      .then((response) => response.json())
      .then((userInfo) => {
        console.log(userInfo);
        chrome.storage.local.set({ "userInfo": userInfo })
      });
    })
    .then(() => switchFrame("menu"));
  });
};