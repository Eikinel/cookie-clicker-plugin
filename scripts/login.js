window.onload = () => {
  getAuthToken().then((preAuthToken) => {
    if (preAuthToken) {
      return switchFrame("menu");
    }
  })
  .catch(() => {});

  document.querySelector("#login").addEventListener('click', () => {
    new Promise((resolve, _) => chrome.identity.getAuthToken({interactive: true}, (token) => resolve(token)))
    .then((token) => {
      if (token) {
        return fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`)
        .then((response) => response.json())
        .then((userInfo) => chrome.storage.local.set({ "userInfo": userInfo }));
      } else {
        throw AuthenticationException.CANCELED_LOGIN;
      }
    })
    .catch((err) => {
      const field = document.querySelector("#info");

      field.classList.remove("hide");
      field.innerHTML = "Canceled login, please retry.";

      throw err;
    })
    .then(() => switchFrame("menu"));
  });
};