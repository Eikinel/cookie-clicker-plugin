window.onload = async function() {
    const logoutButton = document.querySelector("#logout");
    const p = new Promise((resolve, reject) => {
        chrome.storage.local.get(["token", "userInfo"], (items) => resolve(items));
    });
    const storage = await p;
    this.console.log(storage);

    logoutButton.addEventListener('click', function() {
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

    if (!storage.userInfo) {
        await window
            .fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${storage.token}`)
            .then((response) => response.json())
            .then((data) => {
                this.console.log("Stock user data");
                chrome.storage.local.set({ "userInfo": data }, () => {
                    chrome.storage.local.get(["token", "userInfo"], (r) => this.console.log(r));
                });
                document.querySelector("#name").innerHTML = data.given_name;
            })
    } else {
        document.querySelector("#name").innerHTML = storage.userInfo.given_name;
    }
}