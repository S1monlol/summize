import EventSource from './scripts/eventsource-polyfill.js'

chrome.commands.onCommand.addListener((shortcut) => {
    console.log('lets reload');
    console.log(shortcut);
    if (shortcut.includes("+M")) {
        // reload current tab
        chrome.tabs.reload();
        chrome.runtime.reload();

    }
})

// on message from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Got message")
    console.log(request);
    console.log(sender);
    console.log(sendResponse);

    chrome.cookies.getAll({ url: "https://chat.openai.com/chat" }, (cookies) => {
        console.log("cookies");
        console.log(cookies);


        // get the cookie with name ""__Secure-next-auth.session-token""

        let cookie = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

        let response = fetch("https://chat.openai.com/api/auth/session", {
            "headers": {
                "cookie": cookie,
            }
        })



        response.then((response) => {
            console.log(response)
            response.json().then((json) => {
                console.log(json);
                const sessionToken = json.accessToken;


                console.log(`Session Token : ${sessionToken}`)

                let body = { "action": "next", "messages": [{ "id": "171c9ee7-ce8d-4056-acf4-75974ee8c8fe", "role": "user", "content": { "content_type": "text", "parts": ["wasd"] } }], "parent_message_id": "425da9a9-246e-433e-8d9a-b435da2e5e14", "model": "text-davinci-002-render" }
                body = JSON.stringify(body);




                const response2 = EventSource("https://chat.openai.com/backend-api/conversation", {
                    "headers": {
                        "accept": "text/event-stream",
                        "accept-language": "en-US,en;q=0.9",
                        "authorization": `Bearer ${sessionToken}`,
                        "content-type": "application/json",
                        "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"macOS\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-openai-assistant-app-id": ""
                    },
                    "referrer": "https://chat.openai.com/chat",
                    "referrerPolicy": "strict-origin-when-cross-origin",
                    "body": body,
                    "method": "POST",
                    "mode": "cors",
                    "credentials": "include",
                    onmessage(ev) {
                        console.log(ev);
                    }
                
                });

                


            });
        })




    });
});
