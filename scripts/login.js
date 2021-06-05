window.onload = () => {
  getAuthToken().then((token) => {
    if (token) {
      getUserInfo(token).then(switchFrame("menu"));
    }
  })
  .catch(() => {});

  document.querySelector("#login").addEventListener('click', () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (token) {
        switchFrame("menu");
      } else {
        const field = document.querySelector("#info");

        field.classList.remove("hide");
        field.innerHTML = "Canceled login, please retry.";
      }
    })
  });
};