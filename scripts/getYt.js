console.log("getting subs");

console.log(ytInitialPlayerResponse)

// if subsUrl var doesnt exist, then create it 
if (typeof subsUrl == 'undefined') {
    var subsUrl
}
if(typeof subs == 'undefined') {
    var subs
}



subsUrl = ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl;

// if the end of the subsUrl is anything but "?lang=en", then change it 
if (subsUrl.slice(-6) != "lang=en") {
    // change last 2 characters to "en"
    subsUrl = subsUrl.slice(0, -2) + "en";
}

console.log(subsUrl);

subs = fetch(subsUrl)
subs.then(response => {
    response.text().then(text => {
        console.log(text)
        let xml = new DOMParser().parseFromString(text,"text/xml");
        let textNodes = [...xml.getElementsByTagName('text')];
        let subsText = textNodes.map(x => x.textContent).join("\n").replaceAll('&#39;',"'");
        console.log(subsText);
        
        window.postMessage({ type: 'FROM_INJECTED_SCRIPT', payload: subsText }, '*');
    
    });


})
