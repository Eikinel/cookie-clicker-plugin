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
    addActionEventListener('open-tab', () => openTab());
    addActionEventListener('logout', () => getAuthToken().then((token) => logout(token)));
    addActionEventListener('refresh-list', () => listSaves({ loader: true }).then(() => new Snackbar('', 'Saves has been refreshed')));
    addActionEventListener('new-save', () => createSave().then((res) => listSaves()));
    ['click', 'buy', 'upgrade'].forEach((type) => {
        addActionEventListener(`auto-${type}`, () => toggleAuto(type));
        useAuto(type);
    });

    // List user's saves from Drive
    listSaves({ loader: true });
}


// CRUD
async function createSave() {
    let bakeryName;
    const wrapper = await crudRequestWrapper();
    
    return getTab()
    .then((tab) => {
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { type: "SAVE" }, (res) => {
                bakeryName = res.bakeryName;
                setTimeout(() => chrome.scripting.executeScript(
                    { 
                        target: { tabId: tab.id },
                        function: getGameHash,
                    },
                    (gameHash) => resolve({
                        bakeryName: res.bakeryName,
                        gameHash: gameHash[0].result
                    })
                ), 500);
            });
        });
    })
    .catch(() => { throw "Cookie Clicker is not opened in any tab, the game cannot be saved." })
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

        new Snackbar('Save file created', `The game has been successfully created in new file "${bakeryName}"`);

        return res.json();
    })
    .catch((err) => new Snackbar('Create save error', `An error occured while creating save file : ${err}`));
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
        });
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
                            <i class="fa fa-pen text-white"></i>
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
                        startRenaming(file.id);
                    }
                });
                addActionEventListener(`save-${file.id}`, () => updateSave(file.id, trimExtension(file.name)).then(() => listSaves()));
                addActionEventListener(`use-${file.id}`, () => useSave(file.id, trimExtension(file.name)));
                addActionEventListener(`copy-${file.id}`, () => copySaveToClipboard(file.id));
                addActionEventListener(`delete-${file.id}`, () => {
                    new Dialog('Confirmation', `
                    <div class="pb-1">Are you sure you want to delete "${trimExtension(file.name)}"?</div>
                    <div class="text-bold">This action is irreversible.</div>`,
                    [
                        { label: 'I changed my mind', validate: false },
                        { label: 'Yes, delete this', classList: ['warning'], validate: true },
                    ])
                    .onClose((validate) => {
                        if (validate) {
                            deleteSave(file.id, trimExtension(file.name)).then(() => listSaves())
                        }
                    });
                });
            }
        });
    })
    .catch((err) => {
        new Snackbar('List save error', `An error occured while fetching save files : ${err}`);
        listDiv.innerHTML = '<span class="text-red text-14 align-self-center">Could not refresh, please retry.</div>'
    });
}

async function updateSave(fileId, filename) {
    const token = await getAuthToken();
    
    return getTab()
    .then((tab) => {
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { type: "SAVE" }, (res) => {
                setTimeout(() => chrome.scripting.executeScript(
                    { 
                        target: { tabId: tab.id },
                        function: getGameHash,
                    },
                    (gameHash) => resolve({
                        bakeryName: res.bakeryName,
                        gameHash: gameHash[0].result
                    })
                ), 500);
            });
        });
    })
    .catch(() => { throw "Cookie Clicker is not opened in any tab, the game cannot be saved." })
    .then((res) => {
        return fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}`, {
            method: 'PATCH',
            headers: new Headers({ 'Authorization': `Bearer ${token}` }),
            body: res.gameHash
        })
    })
    .then((res) => {
        new Snackbar('Save file updated', `Game has been saved in file "${filename}"`);
        return res.json();
    })
    .catch((err) => new Snackbar('Update save error', `An error occured while creating save file : ${err}`));
}

async function renameSave(fileId, previousFilename, filename) {
    if (previousFilename !== filename && filename.length > 0) {
        return getAuthToken()
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
    
    return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: getHeaders(token)
    })
    .then(() => new Snackbar('Save file deleted', `The save "${filename}" has been successfuly deleted.`))
    .catch((err) => new Snackbar('Delete error', `An error occured while deleting save : ${err}`));
}

async function useSave(fileId, filename) {
    return Promise.all([readSave(fileId), getTab()])
    .then(([gameHash, tab]) => {
        chrome.tabs.sendMessage(tab.id, {
            type: "LOAD",
            gameHash: gameHash
        });
        new Snackbar('', `Game "${filename}" has been loaded`);
    })
    .catch((err) => new Snackbar('Loading error', `An error occured while reading save file : ${err}`));
}

async function readSave(fileId) {
    const token = await getAuthToken();

    return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: getHeaders(token)
    })
    .then((res) => res.text())
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

async function copySaveToClipboard(fileId) {
    const token = await getAuthToken();
    
    return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: getHeaders(token)
    })
    .catch((err) => new Snackbar('Copy error', `An error occured while copying save to clipboard : ${err}`))
    .then((res) => res.text())
    .then((gameHash) => navigator.clipboard.writeText(gameHash))
    .finally(() => new Snackbar('', 'Save copied to clipboard'));
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

async function getTab() {
    return new Promise((resolve, reject) => chrome.tabs.query({ url: "*://orteil.dashnet.org/cookieclicker/" }, ([tab]) => (tab ? resolve : reject)(tab)))
}

async function openTab() {
    getTab()
    .then((tab) => chrome.tabs.update(tab.id, { highlighted: true }))
    .catch(() => chrome.tabs.create({ url: 'https://orteil.dashnet.org/cookieclicker/' }));
}

async function getAuto(type) {
    const storageKey = `auto${type}`;

    return new Promise((resolve) => chrome.storage.local.get([storageKey], (storage) => {
        document.querySelector(`#auto-${type}`).innerHTML = `Auto${type}: ${storage[storageKey] ? 'ON' : 'OFF'}`;
        resolve(storage[storageKey]);
    }));
}

async function setAuto(type, value) {
    chrome.storage.local.set({ [`auto${type}`]: value });
    return useAuto(type);
}

async function toggleAuto(type) {
    return getAuto(type).then((value) => setAuto(type, !Boolean(value)))
}

async function useAuto(type) {
    return Promise.all([getTab(), getAuto(type)])
    .then(([tab, value]) => {
        chrome.tabs.sendMessage(tab.id, { type: `AUTO${type.toUpperCase()}`, toggled: value })
    })
    .catch(() => {})
}

function getGameHash() {
    return window.localStorage.getItem('CookieClickerGame');
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

function addActionEventListener(elemId, callback) {
    document.querySelector(`#${elemId}`).addEventListener('click', () => {
        if (isLoading(elemId)) return; // Prevents spam clicks
        setLoader(elemId, callback());
    });
}