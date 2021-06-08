let autoFns = {
    click: [],
    buy: [],
    upgrade: [],
}

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
            autoFns.click.forEach((fn) => clearTimeout(fn));

            if (request.toggled) {
                autoFns.click.push(setInterval(() => document.querySelector("#bigCookie").click(), 0));
                autoFns.click.push(setInterval(() => {
                    [...document.getElementsByClassName('shimmer')].forEach((shimmer) => shimmer.click());
                }, 1000));
            }

            break;
        case "AUTOBUY":
            autoFns.buy.forEach((fn) => clearTimeout(fn));
    
            if (request.toggled) {
                autoFns.buy.push(setInterval(() => {
                    [...document.getElementsByClassName('product unlocked enabled')]?.reverse()[0]?.click();
                }, 2000));
            }
    
            break;
        case "AUTOUPGRADE":
            autoFns.upgrade.forEach((fn) => clearTimeout(fn));
        
            if (request.toggled) {
                autoFns.upgrade.push(setInterval(() => {
                    [...document.getElementsByClassName('crate upgrade enabled')].forEach((upgrade) => upgrade.click());
                }, 1000));
            }
        
            break;
        default:
            break;
    }
});