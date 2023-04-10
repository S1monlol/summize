let accessToken
let videoId

function convertYoutubeApiUrlToNormalUrl(apiUrl) {
    const regex = /\\u0026/g;
    apiUrl = apiUrl.replace(regex, '&');
    return decodeURIComponent(apiUrl);
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

        let h2 = document.querySelector("#sum")

        h2.innerText = streamedText
    } else if (request.action === 'start_stream') {
        // Start the stream
        console.log("start stream")

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

        let response = fetch("https://www.youtube.com/watch?v=" + window.location.href.split("v=")[1]).then(res => res.text()).then(text => {
            console.log(text)

            // get the first instance of "https://www.youtube.com/api/timedtext?v=", and get the full url, then console log it 
            const regex = /https:\/\/www.youtube.com\/api\/timedtext\?v=.*?(?=")/;
            const match = text.match(regex);

            if (match) {
                const apiUrl = match[0];
                let subsUrl = convertYoutubeApiUrlToNormalUrl(apiUrl);
                

                if (subsUrl.slice(-6) != "lang=en") {
                    // change last 2 characters to "en"
                    subsUrl = subsUrl.slice(0, -2) + "en";
                }

                console.log(subsUrl);



                subs = fetch(subsUrl)
                subs.then(response => {
                    response.text().then(text => {
                        console.log(text)
                        let xml = new DOMParser().parseFromString(text, "text/xml");
                        let textNodes = [...xml.getElementsByTagName('text')];
                        let subsText = textNodes.map(x => x.textContent).join("\n").replaceAll('&#39;', "'");
                        console.log(subsText);

                        // replace \n with "\n"
                        subsText = subsText.replaceAll("\n", "\\n")

                        // replace any space thats more than 1 with a single space
                        subsText = subsText.replaceAll(/\s+/g, ' ');

                        chrome.runtime.sendMessage({ message: 'getAccessToken', subs: subsText, videoId: videoId }, (response) => {
                            accessToken = response;
                            console.log(accessToken);
                        });
                    });
                })
            }
        })




    } else if (request.action === 'test') {
        console.log("test")

        let response = fetch("https://www.youtube.com/watch?v=" + window.location.href.split("v=")[1]).then(res => res.text()).then(text => {
            console.log(text)

            // get the first instance of "https://www.youtube.com/api/timedtext?v=", and get the full url, then console log it 
            const regex = /https:\/\/www.youtube.com\/api\/timedtext\?v=.*?(?=")/;
            const match = text.match(regex);

            if (match) {
                const apiUrl = match[0];
                const normalUrl = convertYoutubeApiUrlToNormalUrl(apiUrl);
                console.log(normalUrl);
            }
        })

        // log text

    }
});