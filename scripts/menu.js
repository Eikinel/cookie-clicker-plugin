const SAVE_FOLDER = "Cookie Clicker Share";
const EXTENSION = ".cookie";
let wrapperCache;

// Check authentication
window.onload = async function() {
    wrapperCache = {};
    const pGetUserInfo = getUserInfo().then((userInfo) => {
        document.querySelector("#name").innerHTML = userInfo.given_name;
        document.querySelector("#avatar").src = userInfo.picture;
    });

    setLoader('avatar', pGetUserInfo);

    // Buttons listeners
    document.querySelector("#open-tab").addEventListener('click', () => openTab())
    document.querySelector("#logout").addEventListener('click', () => {
        getAuthToken().then((token) => logout(token))
    });
    document.querySelector("#refresh-list").addEventListener('click', () => {
        listSaves({ loader: true }).then(() => new Snackbar('', 'Saves has been refreshed'));
    });
    document.querySelector("#new-save").addEventListener('click', () => createSave().then((res) => listSaves()));

    // List user's saves from Drive
    listSaves({ loader: true });
}


// CRUD
async function createSave() {
    let bakeryName;
    const wrapper = await crudRequestWrapper();
    const pCreateSave = new Promise((resolve) => {
        chrome.tabs.query({ url: "*://orteil.dashnet.org/cookieclicker/" }, (tabs) => resolve(tabs))
    })
    .then((tabs) => {
        return new Promise((resolve, reject) => {
            if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "SAVE" }, (res) => {
                    bakeryName = res.bakeryName;
                    setTimeout(() => chrome.tabs.executeScript(tabs[0].id, { code: "localStorage.getItem('CookieClickerGame')" }, (gameHash) => resolve({
                        bakeryName: res.bakeryName,
                        gameHash: gameHash[0]
                    })), 500);
                });
            } else {
                reject("Cookie Clicker is not opened in any tab, the game cannot be saved.");
            }
        });
    })
    .then((res) => {
        const form = new FormData();
        const file = new Blob([res.gameHash], { type: 'text/plain' });
        const metadata = {
            mimeType: 'text/plain',
            createdTime: new Date(),
            name: `${res.bakeryName + EXTENSION}`,
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
    .then((res) => {
        if (!res.ok) throw `creating save file from Drive failed with HTTP status ${res.status}`;

        new Snackbar('Create save', `The game has been successfully created in new file "${bakeryName}"`);

        return res.json();
    })
    .catch((err) => new Snackbar('Create save error', `An error occured while creating save file : ${err}`));

    setLoader('new-save', pCreateSave);

    return pCreateSave;
}

async function listSaves(options) {
    const listDiv = document.querySelector("#save-list");

    if (options?.loader) {
        listDiv.innerHTML = '<div class="loader"></div>';
    }

    return crudRequestWrapper()
    .then((wrapper) => {
        return fetch(`https://www.googleapis.com/drive/v3/files?key=${API_KEY}
        &pageSize=5&q='${wrapper.folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false
        &fields=files(id, name, modifiedTime)`, {
            headers: getHeaders(wrapper.token)
        })
        .then((res) => {
            if (!res.ok) throw `fetching files from Drive failed with HTTP status ${res.status}`;
            return res.json();
        })
        .then((filesJson) => {
            // Clear loader
            listDiv.innerHTML = ''

            // Populate div
            filesJson.files?.forEach((file, index) => {
                const match = file.name.match(/^([^\.]+)(\.cookie)$/gm);

                if (match) {
                    listDiv.insertAdjacentHTML('beforeend', 
                        `<div class="d-flex listing justify-content-between align-items-center w-100 ${index < filesJson.files.length - 1 ? 'pb-3' : ''}">
                            <div class="d-flex flex-column w-100">
                                <div id="editable-${file.id}" class="d-flex align-items-center flex-grow-1 pb-1">
                                    <span id="filename-${file.id}">${match[0].substring(0, match[0].length - 7)}</span>
                                    <i class="fas fa-pen text-white"></i>
                                </div>
                                <span class="text-grey text-italic text-normal text-12">
                                    Last modification on ${formatDate(file.modifiedTime)}
                                </span>
                            </div>
                            
                            <div class="actions d-flex flex-wrap justify-content-end">
                                <a id="save-${file.id}" class="option">Save</a>
                                <a id="use-${file.id}" class="option">Use</a>
                                <a id="copy-${file.id}" class="option">Copy</a>
                                <a id="delete-${file.id}" class="option warning">Delete</a>
                            </div>
                        </div>`
                    );

                    document.querySelector(`#editable-${file.id}`).addEventListener('click', () => {
                        if (document.querySelector(`#filename-${file.id}`)) {
                            startRenaming(file.id)
                        }
                    });
                    document.querySelector(`#save-${file.id}`).addEventListener('click', () => {
                        updateSave(file.id, trimExtension(file.name)).finally(() => listSaves())
                    });
                    document.querySelector(`#use-${file.id}`).addEventListener('click', () => useSave(file.id, trimExtension(file.name)));
                    document.querySelector(`#copy-${file.id}`).addEventListener('click', () => copySaveToClipboard(file.id));
                    document.querySelector(`#delete-${file.id}`).addEventListener('click', () => {
                        deleteSave(file.id, trimExtension(file.name)).finally(() => listSaves())
                    });
                }
            });
        })
    })
    .catch((err) => new Snackbar('List save error', `An error occured while fetching save files : ${err}`))
}


async function updateSave(fileId, filename) {
    const token = await getAuthToken();
    const pUdateSave = new Promise((resolve) => {
        chrome.tabs.query({ url: "*://orteil.dashnet.org/cookieclicker/" }, (tabs) => resolve(tabs))
    })
    .then((tabs) => {
        return new Promise((resolve, reject) => {
            if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "SAVE" }, (res) => {
                    setTimeout(() => chrome.tabs.executeScript(tabs[0].id, { code: "localStorage.getItem('CookieClickerGame')" }, (gameHash) => resolve({
                        bakeryName: res.bakeryName,
                        gameHash: gameHash[0]
                    })), 500);
                });
            } else {
                reject("Cookie Clicker is not opened in any tab, the game cannot be saved.");
            }
        });
    })
    .then((res) => {
        return fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}`, {
            method: 'PATCH',
            headers: new Headers({ 'Authorization': `Bearer ${token}` }),
            body: res.gameHash
        })
    })
    .then((res) => {
        new Snackbar('Update save', `Game has been saved in file "${filename}"`);
        return res.json();
    })
    .catch((err) => new Snackbar('Update save error', `An error occured while creating save file : ${err}`));

    setLoader(`save-${fileId}`, pUdateSave);

    return pUdateSave;
}

async function renameSave(fileId, previousFilename, filename) {
    if (previousFilename !== filename && filename.length > 0) {
        getAuthToken()
        .then((token) => {
            return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                method: 'PATCH',
                headers: getHeaders(token),
                body: JSON.stringify({
                    name: `${filename + EXTENSION}`
                })
            })
            .then((res) => {
                if (!res.ok) throw `patching file from Drive failed with HTTP status ${res.status}`;
                return res.json();
            })
        })
        .catch((err) => new Snackbar('Renaming error', `An error occured while renaming save : ${err}`))
    } else {
        const span = document.createElement("span");

        span.id = `filename-${fileId}`;
        span.innerHTML = previousFilename;
        document.querySelector(`textarea`).replaceWith(span);
    }
}

async function deleteSave(fileId, filename) {
    const token = await getAuthToken();
    const pDeleteSave = fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: getHeaders(token)
    })
    .then(() => new Snackbar('Delete', `The save "${filename}" has been successfuly deleted.`))
    .catch((err) => new Snackbar('Delete', `An error occured while deleting save : ${err}`));

    setLoader(`delete-${fileId}`, pDeleteSave);

    return pDeleteSave;
}

async function useSave(fileId, filename) {
    const token = await getAuthToken();

    const pGameHash = fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: getHeaders(token)
    })
    .then((res) => res.text())

    const pTabs = new Promise((resolve) => {
        chrome.tabs.query({ url: "*://orteil.dashnet.org/cookieclicker/" }, (tabs) => resolve(tabs))
    })

    const pAll = Promise.all([pGameHash, pTabs])
    .then(([gameHash, tabs]) => {
        if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "LOAD",
                gameHash: gameHash
            });
            new Snackbar('', `Game "${filename}" has been loaded`);
        } else {
            throw 'Cookie Clicker is not opened in any tab, the game cannot be loaded.';
        }
    })
    .catch((err) => new Snackbar('Loading error', `An error occured while reading save file : ${err}`))

    setLoader(`use-${fileId}`, pAll);
}

async function copySaveToClipboard(fileId) {
    const token = await getAuthToken();

    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: getHeaders(token)
    })
    .catch((err) => new Snackbar('Copy error', `An error occured while copying save to clipboard : ${err}`))
    .then((res) => res.text())
    .then((gameHash) => navigator.clipboard.writeText(gameHash))
    .finally(() => new Snackbar('', 'Save copied to clipboard'));
}


// Methods
async function crudRequestWrapper() {
    if (wrapperCache?.folderId) {
        return new Promise((resolve) => resolve(wrapperCache));
    }

    const token = await getAuthToken();
    
    return getSaveFolderId(token)
    .then((folderId) => {
        wrapperCache = {
            token: token,
            folderId: folderId
        }

        return wrapperCache;
    });
}

async function getSaveFolderId(token) {
    return fetch(`https://www.googleapis.com/drive/v3/files?key=${API_KEY}
    &q=mimeType='application/vnd.google-apps.folder' and name='${SAVE_FOLDER}'`, {
        headers: getHeaders(token)
    })
    .then((res) => res.json())
    .then((folder) => {
        if (!folder.files) {
            throw new Error('Error retrieving files from Drive');
        }

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
    .then((folder) => folder.files[0].id)
    .catch((err) => new Snackbar('Fetch error', `An error occured while fetching game data : ${err}`))
}

async function openTab() {
    chrome.tabs.query({ url: 'https://orteil.dashnet.org/cookieclicker/' }, ([tab]) => {
        console.log(tab);
        if (!tab) {
            chrome.tabs.create({ url: 'https://orteil.dashnet.org/cookieclicker/' });
            return;
        }
    
        chrome.tabs.update(tab.id, { highlighted: true });
    });
}


function startRenaming(fileId) {
    const field = document.querySelector(`#filename-${fileId}`);
    const previousFilename = field.innerHTML;
    const textarea = document.createElement("textarea");

    textarea.value = previousFilename;

    textarea.addEventListener('input', () => {
        textarea.style.height = "0";
        textarea.style.height = textarea.scrollHeight + 'px';
    });
    textarea.addEventListener('change', () => {
        textarea.style.height = "0";
        textarea.style.height = textarea.scrollHeight + 'px';
    });
    textarea.addEventListener('blur', () => renameSave(fileId, previousFilename, textarea.value).then(() => listSaves()));
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            document.querySelector(`textarea`).blur();
        }
    });

    field.replaceWith(textarea);
    textarea.style.height = textarea.scrollHeight + 'px';
    textarea.focus();
}

function formatDate(datestring) {
    const date = new Date(datestring);

    return date.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });
}

function trimExtension(filename) {
    return filename.substring(0, filename.length - EXTENSION.length);
}