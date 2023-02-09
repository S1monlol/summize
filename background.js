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

    if (request.subject != "sum") {
        return;
    }

    chrome.cookies.getAll({ url: "https://chat.openai.com/chat" }, (cookies) => {

        var tabId;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            tabId = tabs[0].id;
        });

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
            if (response.status == 403) {

                // get response boy text
                response.text().then((text) => {
                    console.log(text);
                });

                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabId, { subject: "login" });

                });

                return;

            }
            response.json().then((json) => {
                console.log(json);
                const sessionToken = json.accessToken;

                let subs = request.transcript


                // remove newlines
                subs = subs.replaceAll("\n", " ")
                subs = subs.replaceAll(" ", "")

                console.log(subs)

                subs = "This is the transcript of a video, summarize it. All of the spaces are removed, try to parse each word \n " + subs


                console.log(`Session Token : ${sessionToken}`)

                let body = { "action": "next", "messages": [{ "id": "171c9ee7-ce8d-4056-acf4-75974ee8c8fe", "role": "user", "content": { "content_type": "text", "parts": [subs] } }], "parent_message_id": "425da9a9-246e-433e-8d9a-b435da2e5e14", "model": "text-davinci-002-render" }
                body = JSON.stringify(body);




                const response2 = fetch("https://chat.openai.com/backend-api/conversation", {
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
                    "credentials": "include"
                });

                response2.then((response) => {
                    console.log(response);

                    if (response.status != 200) {
                        console.log("there was an error")
                        if (response.status == 429) {
                            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                chrome.tabs.sendMessage(tabId, { subject: "429" });
                            });
                        }

                        return;
                    }


                    // make sure this is only called once
                    if (!reader) {
                        var reader = response.body.getReader();
                    }

                    // old tab url
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        var oldcurrentTab = tabs[0];
                        var oldcurrentTabUrl = oldcurrentTab.url;
                        console.log(oldcurrentTabUrl);



                        (async function () {
                            var done2 = false;

                            try {
                                while (!done2) {
                                    const { value, done } = await reader.read();

                                    let data = new TextDecoder("utf-8").decode(value)

                                    // get current tab url 
                                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                                        var currentTab = tabs[0];
                                        var currentTabUrl = currentTab.url;
                                        console.log(currentTabUrl);

                                        console.log(oldcurrentTabUrl)

                                        if (!data.includes("data: [DONE]") && currentTabUrl == oldcurrentTabUrl) {

                                            let parts = data.split("data: ")
                                            parts = parts[1]
                                            try {
                                                parts = JSON.parse(parts).message.content.parts[0]
                                                console.log(parts)

                                                // send message to content script with subject "part"
                                                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                                    chrome.tabs.sendMessage(tabId, { subject: "part", part: parts });
                                                });

                                            } catch (e) {
                                                console.log("error")
                                                console.log(e)
                                            }
                                        } else {
                                            console.log("done")
                                            done2 = true;

                                        }


                                    });
                                }
                            } catch (e) {
                                console.log("error")
                                console.log(e)
                            }

                            return


                        });

                        return 


                    });


                })


            });
        });




    });
});


chrome.webNavigation.onHistoryStateUpdated.addListener(async function (details) {
    console.log("new page");
    // send message to content script with subject "part"
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { subject: "newPage" });
    });
});
