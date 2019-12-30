chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Load HTML to interact with 'Game.LoadSave(gameHash)'
    window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, keyCode: 79 }))
    document.querySelector("#textareaPrompt").innerHTML = request.gameHash;
    document.querySelector("#promptOption0").click();

    sendResponse({ loaded: true });
});