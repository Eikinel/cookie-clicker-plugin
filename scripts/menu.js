// Check authentication
window.onload = async function() {
    const pStorage = new Promise((resolve) => {
        chrome.storage.local.get(["userInfo"], (storage) => resolve(storage));
    });
    const storage = await pStorage;

    // Set user's data from storage
    if (storage.userInfo) {
        document.querySelector("#name").innerHTML = storage.userInfo.given_name;
        document.querySelector("#avatar").src = storage.userInfo.picture;
    }

    // Buttons listeners
    document.querySelector("#logout").addEventListener('click', () => {
        getAuthToken().then((token) => logout(token));
    });

    document.querySelector("#refresh-list").addEventListener('click', () => listSaves());
    document.querySelector("#new-save").addEventListener('click', () => {
        createSave().then(() => listSaves());
    });

    // List user's saves from Drive
    listSaves();
}


// CRUD
async function createSave() {
    return crudRequestWrapper()
    .then((wrapper) => {
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
            const date = new Date();
            const file = new Blob([`${gameHash}`], {type: 'text/plain'});

            return fetch(`https://www.googleapis.com/drive/v3/files?key=${API_KEY}&uploadType=multipart`, {
                method: 'POST',
                headers: getHeaders(wrapper.token),
                body: JSON.stringify({
                    file: file,
                    mimeType: 'text/plain',
                    createdTime: date,
                    name: `${date.toDateString()}${EXTENSION}`,
                    parents: [`${wrapper.folderId}`]
                })
            })
        })
        .then((res) => res.json())
        .then((jsonData) => console.log(jsonData));
    });
}

async function listSaves() {
    crudRequestWrapper()
    .then((wrapper) => {
        fetch(`https://www.googleapis.com/drive/v3/files?key=${API_KEY}` +
        `&pageSize=5&q='${wrapper.folderId}' in parents and mimeType!='application/vnd.google-apps.folder'`, {
            headers: getHeaders(wrapper.token)
        })
        .then((res) => res.json())
        .then((filesJson) => {
            filesJson.files = filesJson.files.filter((file) => !file.trashed);
            const listDiv = document.querySelector("#save-list");

            listDiv.innerHTML = "";

            // Populate div
            for (const file of filesJson.files) {
                const match = file.name.match(/^([^\.]+)(\.cookie)$/gm);

                if (match) {
                    listDiv.innerHTML +=
                    `<div class="d-flex listing justify-content-flex-end flex-wrap w-100">
                        <span class="flex-grow-1">${match[0]}</span>
                        <div class="d-flex listing">
                            <a id="save-${file.id}" class="option">Save</a>
                            <a id="use-${file.id}" class="option">Use</a>
                            <a id="delete-${file.id}" class="option warning">Delete</a>
                        </div>
                    </div>`

                    document.querySelector(`#save-${file.id}`).addEventListener('click', () => updateSave(file.id));
                    document.querySelector(`#use-${file.id}`).addEventListener('click', () => {
                        console.log(`Using ${file.id}`);
                    });
                    document.querySelector(`#delete-${file.id}`).addEventListener('click', () => deleteSave(file.id));
                }
            }
        });
    });
}

async function updateSave(fileId) {
    crudRequestWrapper()
    .then((wrapper) => {
        
    });
}

async function deleteSave(fileId) {
    crudRequestWrapper()
    .then((wrapper) => {
        console.log(wrapper);
    });    
}


// Methods
async function crudRequestWrapper() {
    const token = await getAuthToken();
    
    return getSaveFolderId(token)
    .then((folderId) => {
        return {
            token: token,
            folderId: folderId
        }
    });
}

async function getSaveFolderId(token) {
    return fetch(`https://www.googleapis.com/drive/v3/files?key=${API_KEY}` +
    `&q=mimeType='application/vnd.google-apps.folder' and name='${SAVE_FOLDER}'`, {
        headers: getHeaders(token)
    })
    .then((res) => res.json())
    .then((folder) => {
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
    
        return folder;
    })
    .then((folder) => folder.files[0].id);
}