
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

// on message from background, or on page load
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Got message")
    console.log(request);
    if (request.subject == "newPage") {
        console.log("Main time")
        if (window.location.href.includes("youtube.com/watch")) {
            // reload page
            console.log("Reloading")
            window.location.reload();
        }
    }
});

// on page load
main();


function main() {
    console.log(window.location.href)
    if (window.location.href.includes("youtube.com/watch")) {
        console.log("Starting")
        const subs = getCaptions();
        subs.then((subs) => {
            console.log("subs are here");
            console.log(subs);

            chrome.runtime.sendMessage({
                subject: "sum",
                transcript: subs
            });

            const h2 = document.createElement("h2");
            // get id of the video 
            let videoId = window.location.href.split("v=")[1];

            h2.id = videoId


            // add the h2 to the same div as document.querySelector("#title > h1")
            // document.querySelector("#title > h1").parentNode.appendChild(h2);

            // wait for document.querySelector("#title > h1") to exist 
            // then add the h2 to the same div as document.querySelector("#title > h1")
            const interval = setInterval(() => {
                if (document.querySelector("#title > h1")) {
                    document.querySelector("#title > h1").parentNode.appendChild(h2);
                    clearInterval(interval);
                }
            }, 1000);



            // listen for message from background
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log("Got message")
                console.log(request);

                if (request.subject == "part") {
                    if (request.url.split("v=")[1] == videoId) {
                        h2.innerText = request.part;
                    }
                } else if (request.subject == "login") {
                    // change h2 to Please login and pass Cloudflare check at chat.openai.com , making the link clickable
                    h2.innerHTML = "Please login and pass Cloudflare check at <a target=\"_blank\" href='https://chat.openai.com/chat'>chat.openai.com</a";

                } else if (request.subject == "429") {
                    // wait 5 seconds then send message again 
                    setTimeout(() => {
                        chrome.runtime.sendMessage({
                            subject: "sum",
                            transcript: subs
                        });
                    }, 5000);
                }

            });
            // do something with subs
        });
    } else if (window.location.href.includes("openai.com/chat")) {
        // send message to background 



    }
}


