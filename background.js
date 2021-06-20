//TODO: https://developer.chrome.com/docs/extensions/mv3/background_pages/

//Initialise extension on installation
chrome.runtime.onInstalled.addListener(function(details) {
    //TODO: figure out what actions need to be performed
    if(details.reason == "install") {
        //Perform some action
    } else if(details.reason == "update") {
        //Perform other action
    }
});

//TODO: figure out what event to listen for to trigger starting the content script
    //Might just be on page load, considering manifest only allows for www.twitch.tv urls

//TODO: sets up communication with content script, this is what I'd use to update the storage (and probably the extension pop-up?) https://developer.chrome.com/docs/extensions/mv3/messaging/
/*chrome.runtime.onConnect.addListener(function(port) {
    //Writes error message to console if port doesn't match
        //TODO: (change this to an if statement)?
    console.assert(port.name === "channel-points");
    //Sets up listener to port
    port.onMessage.addListener(function(msg) {
        if(msg.keyword == "Insert message here") {
            port.postMessage({keyword: "Message received"})
        }
    });
});*/