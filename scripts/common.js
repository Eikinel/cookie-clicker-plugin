// Abstract getAuthToken
function getAuthToken() {
    return new Promise((resolve, reject) => chrome.identity.getAuthToken({interactive: false}, (preAuthToken) => {
        if (!preAuthToken) {
            reject("Token wrong or expired");
            logout(preAuthToken);
        }
    
        resolve(preAuthToken);
    }));
}

function logout(token) {
    if (token) {
        chrome.identity.removeCachedAuthToken({token: token});
        chrome.storage.local.clear(() => {
            console.log('Logged out');
            switchFrame("login");
        });
    }
}

function switchFrame(frame) {
    chrome.browserAction.setPopup({popup: `html/${frame}.html`}, () => window.location.href = `${frame}.html`);
}