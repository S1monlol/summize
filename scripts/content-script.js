let accessToken
let videoId

function injectYt() {
    let s = document.createElement('script');
    s.src = chrome.runtime.getURL('scripts/getYt.js');
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

window.addEventListener('message', (event) => {
    if (event.source != window) {
        return;
    }

    if (event.data.type && (event.data.type == 'FROM_INJECTED_SCRIPT')) {
        console.log('Content script received: ' + event.data.payload);

        console.log("videoId: " + videoId)

        chrome.runtime.sendMessage({ message: 'getAccessToken', subs: event.data.payload, videoId: videoId }, (response) => {
            accessToken = response;
            console.log(accessToken);
        });

    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'streamed_text_' + videoId) {
        const streamedText = request.text;
        // Process the streamed text received from the background script
        console.log(streamedText)

        h2.innerText = streamedText
    } else if (request.action === 'start_stream') {
        // Start the stream
        console.log("start stream")
        injectYt()

        const h2 = document.createElement("h2");
        // get id of the video 
        videoId = window.location.href.split("v=")[1];

        h2.id = "sum"

        // delete any old h2s 
        const oldH2 = document.querySelector("#sum")

        if (oldH2) {
            oldH2.remove()
        }


        const interval = setInterval(() => {
            if (document.querySelector("#title > h1")) {
                document.querySelector("#title > h1").parentNode.appendChild(h2);
                clearInterval(interval);
            }
        }, 1000);

    }
});