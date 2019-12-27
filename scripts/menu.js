window.onload = async function() {
    const logoutButton = document.querySelector("#logout");
    const createSaveButton = document.querySelector("#add-save");
    const pStorage = new Promise((resolve, reject) => {
        chrome.storage.local.get(["token", "userInfo"], (items) => resolve(items));
    });
    const storage = await pStorage;

    // Get user info
    if (!storage.userInfo) {
        await window
            .fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${storage.token}`)
            .then((response) => response.json())
            .then((data) => chrome.storage.local.set({ "userInfo": data }));
    }
    document.querySelector("#name").innerHTML = storage.userInfo.given_name;
    document.querySelector("#avatar").src = storage.userInfo.picture;

    // Buttons listeners
    logoutButton.addEventListener('click', () => {
        window
            .fetch(`https://accounts.google.com/o/oauth2/revoke?token=${storage.token}`)
            .then((response) => {
                chrome.identity.removeCachedAuthToken({token: storage.token});
                    
                console.log('Logged out');
                chrome.storage.local = {};
                chrome.browserAction.setPopup({popup: "html/login.html"});
                window.location.href = "login.html";

                return response;
            });
    });

    createSaveButton.addEventListener('click', () => {
        new Promise((resolve, reject) => chrome.tabs.query({ url: "*://orteil.dashnet.org/cookieclicker/" }, (tab) => {
            console.log(tab);
            resolve(tab);
        }))
        .then((tab) => {
            return new Promise((resolve, reject) => {
                if (tab && tab[0]) {
                    chrome.tabs.executeScript(tab[0].id, { code: "localStorage['CookieClickerGame']" }, (gameHash) => resolve(gameHash));
                } else {
                    reject("No opened tab matching Cookie Clicker URL");
                }
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