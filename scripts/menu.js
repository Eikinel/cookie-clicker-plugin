// Check authentication
window.onload = async function() {
    const logoutButton = document.querySelector("#logout");
    const createSaveButton = document.querySelector("#import-save");
    const pStorage = new Promise((resolve) => {
        chrome.storage.local.get(["userInfo"], (storage) => resolve(storage));
    });
    const storage = await pStorage;

    // Set user's data from storage
    if (storage.userInfo) {
        document.querySelector("#name").innerHTML = storage.userInfo.given_name;
        document.querySelector("#avatar").src = storage.userInfo.picture;
    }

    // List user's saves from Drive
    this.listSaves();

    // Buttons listeners
    logoutButton.addEventListener('click', () => {
        getAuthToken().then((token) => logout(token));
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

async function listSaves() {
    getAuthToken()
    .then((token) => {
        fetch(`https://www.googleapis.com/drive/v3/files?key=${API_KEY}` +
              `&q=mimeType='application/vnd.google-apps.folder' and name='${SAVE_FOLDER}'`, {
            headers: getHeaders(token)
        })
        .then((res) => res.json())
        .then((folder) => {
            console.log(folder);
            // Create new folder if it doesn't exist
            if (folder.files.length < 1) {
                return fetch(`https://www.googleapis.com/drive/v3/files?key=${API_KEY}`, {
                    method: 'POST',
                    headers: getHeaders(token),
                    body: JSON.stringify({
                        mimeType: 'application/vnd.google-apps.folder',
                        name: SAVE_FOLDER
                    })
                })
            }
    
            return new Promise((res) => res(folder));
        })
        .then((folder) => console.log(folder));
    })
}