
function inject() {
    var s = document.createElement('script');
    s.src = chrome.runtime.getURL('scripts/getYt.js');
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

function getCaptions() {
    // get current subs from localStorage
    inject();

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
const subs = getCaptions();
subs.then((subs) => {
    console.log("subs are here");
    console.log(subs);
    // do something with subs
});


