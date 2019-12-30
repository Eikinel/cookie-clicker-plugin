chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "LOAD":
            // Load HTML to interact with 'Game.LoadSave(gameHash)'
            window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, keyCode: 79 }));
            document.querySelector("#textareaPrompt").innerHTML = request.gameHash;
            document.querySelector("#promptOption0").click();
        
            sendResponse({ loaded: true });
            break;
        case "SAVE":
            window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, keyCode: 83 }));

            sendResponse({ saved: true });
            break;
        default:
            break;
    }
});