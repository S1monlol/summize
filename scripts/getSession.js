console.log("Script Injected");
// define monkey patch function
// const originalFetch = window.fetch;
// window.fetch = async function (input, init) {
//     console.log("fetching");
//     console.log(input);
//     console.log(init.headers.Authorization);
//     // call the original fetch function
//     const response = await originalFetch(input, init);

//     // send message to background script
//     chrome.runtime.sendMessage({
//         payload: {
//             sessionToken: init.headers.Authorization,
//         },
//     });
    

//     // get the response body
//     const text = await response.text();
//     console.log(text);
//     // return the response
//     return response;
// }

