console.log("getting subs");

let subsUrl = ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl;
let subs = fetch(subsUrl)
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
