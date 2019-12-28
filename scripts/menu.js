// Check authentication
window.onload = async function() {
    await getAuthToken();

    const logoutButton = document.querySelector("#logout");
    const createSaveButton = document.querySelector("#new-save");
    const storage = await new Promise((resolve) => {
        chrome.storage.local.get(["userInfo"], (storage) => resolve(storage));
    });

    // Set user's data from storage
    document.querySelector("#name").innerHTML = storage.userInfo.given_name;
    document.querySelector("#avatar").src = storage.userInfo.picture;

    // List user's saves from Drive
    fetch("https://www.googleapis.com/drive/v3/files?" +
        "key=AIzaSyCZvxontknsN3w_Zqx38TNsH0ulWVpcpQQ&" +
        "q=mimeType = 'application/vnd.google-apps.folder'"
    )
    .then((res) => {
        switch (res.status) {
            case 200:
                console.log(res);
                break;
            case 401:
                break;
        }
    })

    // Buttons listeners
    logoutButton.addEventListener('click', () => {
        getAuthToken().then((token) => {
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
            .then((response) => {
                this.logout(token);
            })
        });
    });

    createSaveButton.addEventListener('click', () => {
        new Promise((resolve) => {
            chrome.tabs.query({ url: "*://orteil.dashnet.org/cookieclicker/" }, (tab) => resolve(tab))
        })
        .then((tab) => {
            return new Promise((resolve, reject) => {
                (tab && tab[0]) ?
                    chrome.tabs.executeScript(tab[0].id, { code: "localStorage.getItem('CookieClickerGame')" }, (gameHash) => resolve(gameHash[0])) :
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