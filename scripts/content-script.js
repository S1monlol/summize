
function injectYt() {
    let s = document.createElement('script');
    s.src = chrome.runtime.getURL('scripts/getYt.js');
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

// function injectSession() {
//     let s = document.createElement('script');
//     s.src = chrome.runtime.getURL('scripts/getSession.js');
//     s.onload = function () {
//         this.remove();
//     };
//     (document.head || document.documentElement).appendChild(s);
// }

function getCaptions() {
    // get current subs from localStorage
    injectYt();

    const yeah = new Promise((resolve, reject) => {
        // listen for message from injected script
        window.addEventListener('message', function (event) {
            if (event.data.type === 'FROM_INJECTED_SCRIPT') {
                console.log("got message from injected script")
                resolve(event.data.payload);
            }
        });
    });
    return yeah;

}

// on load of page inject script

if (window.location.href.includes("youtube.com/watch")) {
    const subs = getCaptions();
    subs.then((subs) => {
        console.log("subs are here");
        console.log(subs);
        // do something with subs
    });
} else if (window.location.href.includes("openai.com/chat")) {
    // send message to background 
    chrome.runtime.sendMessage({
        payload: {}
    });

    // listen for message from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Got message")
        console.log(request);
        console.log(sender);
        console.log(sendResponse);
    });


}


