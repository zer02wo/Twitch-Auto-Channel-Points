//TODO: add functions:
    //Toggle debug mode
    //Toggle observation on/off (messaging to background, to then message content script)
    //Ko-Fi donation button
    //Display per channel and overall total (and session) points https://developer.chrome.com/docs/extensions/reference/storage/

//Permission request must be contained within user gesture
document.getElementById("storage-permission").addEventListener("click", function(e) {
    chrome.permissions.request({
        permissions: ["storage"],
        origins: ["https://www.twitch.tv/*"],

    }, function(granted) {
        //User grants permission
        if(granted) {
            //TODO: set up storage
            console.log("Permission granted!");
        } else {
            //TODO: prepare to not use storage
            console.log("Permission denied!");
        }
    });
});