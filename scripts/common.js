const AuthenticationException = {
    CANCELED_LOGIN: 0,
    INVALID_TOKEN: 1
};

function getAuthToken() {
    return new Promise((resolve, reject) => chrome.identity.getAuthToken({interactive: false}, (preAuthToken) => {
        if (preAuthToken) {
            resolve(preAuthToken);
        } else {
            chrome.browserAction.getPopup({}, (popup) => !popup.match(/\/(login\.html)/g) ? logout() : 0);
            reject(AuthenticationException.INVALID_TOKEN);
        }
    }));
}

async function logout(token) {
    if (token) {
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
        .then(() => chrome.identity.removeCachedAuthToken({token: token}));
    }

    chrome.storage.local.clear(() => setTimeout(switchFrame("login"), 1000));
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