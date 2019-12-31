const SAVE_FOLDER = "Cookie Clicker Share";
const EXTENSION = ".cookie";

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
        createSave().then((res) => listSaves());
    });

    // List user's saves from Drive
    listSaves();
}


// CRUD
async function createSave() {
    const wrapper = await crudRequestWrapper();

    return new Promise((resolve) => {
        chrome.tabs.query({ url: "*://orteil.dashnet.org/cookieclicker/" }, (tabs) => resolve(tabs))
    })
    .then((tabs) => {
        return new Promise((resolve, reject) => {
            if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "SAVE" }, (res) => {
                    chrome.tabs.executeScript(tabs[0].id, { code: "localStorage.getItem('CookieClickerGame')" }, (gameHash) => resolve(gameHash[0]))        
                });
            } else {
                reject("No opened tab matching Cookie Clicker URL");
            }
        });
    })
    .catch(())
    .then((gameHash) => {
        const form = new FormData();
        const file = new Blob([gameHash], { type: 'text/plain' });
        const metadata = {
            mimeType: 'text/plain',
            createdTime: new Date(),
            name: `Test${EXTENSION}`,
            parents: [wrapper.folderId]                    
        };

        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json;charset=UTF-8' }));
        form.append('file', file);

        return fetch(`https://www.googleapis.com/upload/drive/v3/files?key=${API_KEY}&uploadType=multipart`, {
            method: 'POST',
            headers: new Headers({ 'Authorization': `Bearer ${wrapper.token}` }),
            body: form
        })
    })
    .then((res) => res.json());
}

async function listSaves() {
    crudRequestWrapper()
    .then((wrapper) => {
        fetch(`https://www.googleapis.com/drive/v3/files?key=${API_KEY}` +
        `&pageSize=5&q='${wrapper.folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`, {
            headers: getHeaders(wrapper.token)
        })
        .then((res) => res.json())
        .then((filesJson) => {
            const listDiv = document.querySelector("#save-list");

            listDiv.innerHTML = "";

            // Populate div
            filesJson.files.forEach((file) => {
                const match = file.name.match(/^([^\.]+)(\.cookie)$/gm);

                if (match) {
                    listDiv.insertAdjacentHTML('beforeend', 
                        `<div class="d-flex listing justify-content-flex-end flex-wrap w-100">
                            <span class="flex-grow-1">${match[0].substring(0, match[0].length - 7)}</span>
                            <div class="d-flex">
                                <a id="save-${file.id}" class="option disabled">Save</a>
                                <a id="use-${file.id}" class="option">Use</a>
                                <a id="delete-${file.id}" class="option warning">Delete</a>
                            </div>
                        </div>`
                    );

                    document.querySelector(`#save-${file.id}`).addEventListener('click', () => updateSave(file.id).then(() => listSaves()));
                    document.querySelector(`#use-${file.id}`).addEventListener('click', () => useSave(file.id));
                    document.querySelector(`#delete-${file.id}`).addEventListener('click', () => deleteSave(file.id).then(() => listSaves()));
                }
            });
        });
    });
}

async function updateSave(fileId) {
    const wrapper = await crudRequestWrapper();
}

async function deleteSave(fileId) {
    const wrapper = await crudRequestWrapper();

    return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: getHeaders(wrapper.token)
    });
}

async function useSave(fileId) {
    const wrapper = await crudRequestWrapper();

    const pGameHash = fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: getHeaders(wrapper.token)
    })
    .then((res) => res.text());

    const pTabs = new Promise((resolve) => {
        chrome.tabs.query({ url: "*://orteil.dashnet.org/cookieclicker/" }, (tabs) => resolve(tabs))
    })

    Promise.all([pGameHash, pTabs])
    .then(([gameHash, tabs]) => {
        console.log({gameHash, tabs});
        if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "LOAD",
                gameHash: gameHash
            });
        }
    })
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
    return fetch(`https://www.googleapis.com/drive/v3/files?key=${API_KEY}
    &q=mimeType='application/vnd.google-apps.folder' and name='${SAVE_FOLDER}'`, {
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