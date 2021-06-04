const AuthenticationException = {
    CANCELED_LOGIN: 0,
    INVALID_TOKEN: 1
};

async function getAuthToken() {
    return new Promise((resolve, reject) => chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
            resolve(token);
        } else {
            chrome.browserAction.getPopup({}, (popup) => !popup.match(/\/(login\.html)/g) ? logout() : 0);
            reject(AuthenticationException.INVALID_TOKEN);
        }
    }));
}

async function getUserInfo() {
    return new Promise((resolve) => chrome.storage.local.get(["userInfo"], (storage) => {
        if (storage.userInfo) {
            resolve(storage.userInfo);
        }
         
        getAuthToken()
        .then((token) => fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`))
        .then((response) => response.json())
        .then((userInfo) => {
            chrome.storage.local.set({ "userInfo": userInfo });
            resolve(userInfo);
        });
    }));
}

async function logout(token) {
    if (token) {
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
        .then(() => chrome.identity.removeCachedAuthToken({ token: token }));
    }

    chrome.storage.local.clear(switchFrame("login"));
}

function switchFrame(frame) {
    chrome.browserAction.setPopup({popup: `html/${frame}.html`}, () => window.location.href = `${frame}.html`);
}

function getHeaders(token, contentType = "application/json") {
    return new Headers({
        'Authorization': `Bearer ${token}`,
        'Content-Type': contentType
    });
}

function generateId() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function setLoader(elemId, promise) {
    const elem = document.querySelector(`#${elemId}`);

    // Image
    if (elem.alt) {
        elem.classList.add('loader');
        elem.src = '../images/cookie-256.png';
        promise.finally(() => elem.classList.remove('loader'));
    } else {
        const elemContent = elem.innerHTML.slice(); // Copy HTML content

        elem.innerHTML = '<div class="loader"></div>';
        promise.finally(() => elem.innerHTML = elemContent);
    }
}