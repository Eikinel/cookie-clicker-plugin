let autoclickFns = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "LOAD":
            // Load HTML to interact with 'Game.LoadSave(gameHash)'
            window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, keyCode: 79 }));
            document.querySelector("#textareaPrompt").innerHTML = request.gameHash;
            document.querySelector("#promptOption0").click();
        
            break;
        case "SAVE":
            const bakeryName = document.querySelector("#bakeryName").innerHTML;

            window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, keyCode: 83 }));

            sendResponse({ bakeryName: bakeryName });
            break;
        case "AUTOCLICK":
            if (request.toggled) {
                autoclickFns.push(setInterval(() => document.querySelector("#bigCookie").click(), 0));
                autoclickFns.push(setInterval(() => [...document.getElementsByClassName('shimmer')].forEach((shimmer) => shimmer.click()), 1000));
            } else {
                autoclickFns.forEach((fn) => clearTimeout(fn));
            }

            break;
        default:
            break;
    }
});