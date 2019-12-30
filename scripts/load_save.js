chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    document.querySelector("#textareaPrompt").innerHTML = request.gameHash;
    document.querySelector("#promptOption0").click();
});

// Game.LoadSave("${gameHash}")