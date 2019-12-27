window.onload = async function() {
    const logoutButton = document.querySelector("#logout");
    const createSaveButton = document.querySelector("#add-save");
    const pStorage = new Promise((resolve) => {
        chrome.storage.local.get(["token", "userInfo"], (items) => resolve(items));
    });
    var storage = await pStorage;

    // Get user info
    if (!storage.userInfo) {
        fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${storage.token}`)
        .then((response) => response.json())
        .then((userInfo) => chrome.storage.local.set({ "userInfo": userInfo }, () => {
            storage.userInfo = userInfo;
            this.setInfos(storage);
        }));
    } else {
        this.setInfos(storage);
    }

    // Buttons listeners
    logoutButton.addEventListener('click', () => {
        window
            .fetch(`https://accounts.google.com/o/oauth2/revoke?token=${storage.token}`)
            .then((response) => {
                chrome.identity.removeCachedAuthToken({token: storage.token});
                this.logout();
            })
            .catch((err) => this.logout());
    });

    createSaveButton.addEventListener('click', () => {
        new Promise((resolve) => chrome.tabs.query({ url: "*://orteil.dashnet.org/cookieclicker/" }, (tab) => {
            resolve(tab);
        }))
        .then((tab) => {
            return new Promise((resolve, reject) => {
                (tab && tab[0]) ?
                    chrome.tabs.executeScript(tab[0].id, { code: "localStorage['CookieClickerGame']" }, (gameHash) => resolve(gameHash)) :
                    reject("No opened tab matching Cookie Clicker URL");
            });
        })
        .then((gameHash) => {
            console.log(gameHash);
            if (gameHash) {
                // Save to user's drive
            }
        })        
    });
}

function logout() {
    chrome.storage.local.clear(() => {
        console.log('Logged out');
        chrome.browserAction.setPopup({popup: "html/login.html"});
        window.location.href = "login.html";
    });
}

function setInfos(storage) {
    document.querySelector("#name").innerHTML = storage.userInfo.given_name;
    document.querySelector("#avatar").src = storage.userInfo.picture;
}