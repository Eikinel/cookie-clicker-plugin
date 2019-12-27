window.onload = async function() {
    const logoutButton = document.querySelector("#logout");
    const p = new Promise((resolve, reject) => {
        chrome.storage.local.get(["token"], (items) => resolve(items.token));
    });
    const token = await p;

    console.log(token);
    logoutButton.addEventListener('click', function() {
        window
            .fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
            .then((response) => {
                chrome.identity.removeCachedAuthToken({token: token}, function() {
                     chrome.storage.local.remove("token");
                });
                    
                console.log('Logged out');
                chrome.storage.local.remove("token");
                chrome.browserAction.setPopup({popup: "html/login.html"});
                window.location.href = "login.html";

                return response;
            });
    });

    window
        .fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`)
        .then((response) => response.json())
        .then((data) => {
            this.console.log(data);
            document.querySelector("#name").innerHTML = data.given_name;
        })
}