chrome.commands.onCommand.addListener((shortcut) => {
    console.log('lets reload');
    console.log(shortcut);
    if (shortcut.includes("+M")) {
        // reload current tab
        chrome.tabs.reload();
        chrome.runtime.reload();

    }
})

function generateUUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


async function getToken() {

    let accessToken
    let response = await fetch("https://chat.openai.com/api/auth/session")

    let body = await response.json()

    console.log(body.accessToken)

    accessToken = body.accessToken

    return accessToken
}

let targetTabId; // The ID of the tab where the content script is running


async function handleStreamedResponse(token, question, videoId, parts) {
    // Make a request to the server that returns a streamed response
    const uuid1 = generateUUIDv4();

    console.log("videoId: " + videoId)

    console.log("question: " + question)
    let subs
    let questionParts

    // if the question is more than 15k characters, then we need to split it into multiple requests


    questionParts = question.match(/.{1,15000}/g);
    console.log(questionParts)
    for (let i = parts.length; i < questionParts.length; i++) {
        if (i == 0) {
            console.log("first part")

            if (question.length > 15000) {
                subs = `This is the first part of the transcript. Keep it to a super short summary, no more than 3 sentences (dont mention that you're reading a transcript): ` + questionParts[i]
            } else {
                subs = "this is a youtube video's transcript. Short summary (dont mention that you're reading a transcript): " + questionParts[i]
            }
            break
        } else {
            subs = `Previous summary: ${parts}. This is the ${i + 1} part of the transcript. Rewritten, continued summary (dont mention that you're reading a transcript): ` + questionParts[i]
            break
        }
    }


    console.log("subs ", subs)

    // let subs = "this is a youtube video's transcript. Short summary (dont mention that you're reading a transcript): " + question
    let body = { "action": "next", "messages": [{ "id": "73954541-ff9e-4785-85e4-d45527ccca73", "author": { "role": "user" }, "content": { "content_type": "text", "parts": [subs] } }], "parent_message_id": uuid1, "model": "text-davinci-002-render-sha", "timezone_offset_min": 240 }
    // let body = { "action": "next", "messages": [{ "id": "171c9ee7-ce8d-4056-acf4-75974ee8c8fe", "role": "user", "content": { "content_type": "text", "parts": [subs] } }], "parent_message_id": "425da9a9-246e-433e-8d9a-b435da2e5e14", "model": "text-davinci-002-render" }
    body = JSON.stringify(body);
    const response = await fetch("https://chat.openai.com/backend-api/conversation", {
        "headers": {
            "accept": "text/event-stream",
            "accept-language": "en-US,en;q=0.9",
            "authorization": `Bearer ${token}`,
            "content-type": "application/json",
            "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-openai-assistant-app-id": "",
            "origin": "https://chat.openai.com"
        },
        "referrer": "https://chat.openai.com/chat",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });

    // Access the body property of the response, which is a ReadableStream
    const reader = response.body.getReader();

    // Recursive function to read and process chunks of data from the stream
    const readChunk = async () => {
        try {
            // Read a chunk of data from the stream
            const { value, done } = await reader.read();

            // If the stream is done, exit the recursion
            if (done) {
                console.log('Stream complete.');
                await deleteConvo(token)
                return;
            }

            // Process the received data chunk (e.g., convert to string and log to console)
            const chunkText = new TextDecoder().decode(value);

            let chunks = chunkText.split("\n\n")

            chunks = chunks.map((chunk) => {
                return chunk.replaceAll('data: ', '')
            })

            console.log(chunks)

            if (chunks[0].includes("[DONE]")) {

                if(parts.length != questionParts.length){
                    // add the last final text to the parts array
                    parts.push(chunks[1])
                    console.log("parts: ", parts)
                    return handleStreamedResponse(token, question, videoId, parts)
                }

                console.log("done")
                await deleteConvo(token)
                return;
            }

            // console.log(chunkText.replace('data: ', ''))
            let chunkJson

            for (let i = 0; i < chunks.length; i++) {
                if (chunks[i]) {
                    try {
                        chunkJson = JSON.parse(chunks[i])
                        break;
                    } catch (e) {
                        console.log(e)
                    }
                }
            }

            if (!chunkJson) {
                return readChunk();
            }

            let finalText = chunkJson.message.content.parts[0]
            console.log(finalText)


            // Check if the tab is still open before sending the message
            chrome.tabs.get(targetTabId, (tab) => {
                if (chrome.runtime.lastError) {
                    console.log('Tab is closed. Stopping streaming.');
                } else {
                    // Send the message to the content script in the specified tab
                    chrome.tabs.sendMessage(targetTabId, { action: 'streamed_text_' + videoId, text: finalText });
                }
            });
            // Continue reading the next chunk
            return readChunk();
        } catch (error) {
            // Handle any errors that may occur while reading the stream
            console.error('Error while reading the stream:', error);
        }
    };

    // Start reading the stream
    readChunk();

    // deleteConvo(token)


}

async function deleteConvo(token) {
    // https://chat.openai.com/backend-api/conversations?offset=0&limit=20
    let response = await fetch("https://chat.openai.com/backend-api/conversations?offset=0&limit=20", {
        "headers": {
            "accept": "text/event-stream",
            "accept-language": "en-US,en;q=0.9",
            "authorization": `Bearer ${token}`,
            "content-type": "application/json",
            "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-openai-assistant-app-id": "",
            "origin": "https://chat.openai.com"
        },
    })

    let body = await response.json()

    console.log(response, body)

    let id = body.items[0].id

    console.log(id)

    // let deleteResponse = await fetch(`https://chat.openai.com/backend-api/conversation/${id}`, {
    //     "headers": {
    //         "accept": "text/event-stream",
    //         "accept-language": "en-US,en;q=0.9",
    //         "authorization": `Bearer ${token}`,
    //         "content-type": "application/json",
    //         "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
    //         "sec-ch-ua-mobile": "?0",
    //         "sec-ch-ua-platform": "\"macOS\"",
    //         "sec-fetch-dest": "empty",
    //         "sec-fetch-mode": "cors",
    //         "sec-fetch-site": "same-origin",
    //         "x-openai-assistant-app-id": "",
    //         "origin": "https://chat.openai.com"
    //     },
    //     "method": "PATCH",
    //     "body": `{"is_visible":false}`
    // })

    // let deleteBody = await deleteResponse.json()

    // console.log(deleteResponse, deleteBody)
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'getAccessToken') {
        getToken().then(accessToken => {
            targetTabId = sender.tab.id
            handleStreamedResponse(accessToken, request.subs, request.videoId, [])
            sendResponse({ accessToken: accessToken });
        });
        // Indicate that the response will be sent asynchronously
        return true;
    }
});


// detect when the tab url changes, and it's a youtube video
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.url && changeInfo.url.includes('youtube.com/watch')) {
        // send message to content script to start the stream
        console.log("New Video")
        chrome.tabs.sendMessage(tabId, { action: 'start_stream' });
    }
    // otherwise detect if the page is refreshed
    else if (changeInfo.status === 'complete') {
        // send message to content script to start the stream
        console.log("Page Refreshed")
        chrome.tabs.sendMessage(tabId, { action: 'start_stream' });
    }
});