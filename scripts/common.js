const SAVE_FOLDER = "Cookie Clicker Share"

function getAuthToken() {
    return new Promise((resolve, reject) => chrome.identity.getAuthToken({interactive: false}, (preAuthToken) => {
        if (preAuthToken) {
            resolve(preAuthToken);
            return;
        }

        chrome.browserAction.getPopup({}, (popup) => !popup.match(/\/(login\.html)/g) ? logout() : 0);
        reject("Token wrong or expired");
    }));
}

function logout(token) {
    if (token) {
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
        chrome.identity.removeCachedAuthToken({token: token});
    }

    chrome.storage.local.clear(() => switchFrame("login"));
}

function switchFrame(frame) {
    chrome.browserAction.setPopup({popup: `html/${frame}.html`}, () => window.location.href = `${frame}.html`);
}

function getHeaders(token) {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}