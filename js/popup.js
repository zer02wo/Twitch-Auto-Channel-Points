//TODO: add functions:
    //Toggle debug mode
    //Toggle observation on/off
    //Ko-Fi donation button
    //Display per channel and overall total (and session) points
    //Reset channel and/or total points
        //Probably just for debugging, but maybe a full feature

//Send handshake to background script when popup opens
chrome.runtime.sendMessage({handshake: "initiate"});
//Listen to receive handshake response from background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    //TODO: set up the popup with this response
        //Get data from messages, organise into local variables, call functions
    if(message.user) {
        initialiseUI(message.user);
    } else if(message.update) {
        updateUI(message.update);
    }
});

//TODO: when popup isn't opened, port is closed, so onConnect never fires
    //get everything from content script into background, then pass to popup
function initialiseUI(username) {
    //Check storage permission to allow certain UI elements
    chrome.permissions.contains({
        permissions: ['storage'],
        origins: ["https://www.twitch.tv/*"]
    }, function(isGranted) {
        if(isGranted) {
            //Get total amount of points earned using extension across all channels
            chrome.storage.sync.get("_total", function(res) {
                //Channel points have not previously been recorded
                if(Object.keys(res).length === 0) {
                    //Create initial storage and set to 0
                    chrome.storage.sync.set({"_total": 0}, function() {
                        console.log("Total channel points initialised to 0");
                        //Create total points UI element
                        createTotalPointsElement(0);
                    });
                } else {
                    //Create total points UI element based on stored value
                    let totalPoints = res["_total"];
                    createTotalPointsElement(totalPoints);
                }
            });

            //Get amount of points earned using extension for this channel
            chrome.storage.sync.get(username, function(res) {
                //Channel points have not previously been recorded for this channel
                if(Object.keys(res).length === 0) {
                    //Create initial storage and set to 0
                    chrome.storage.sync.set({[username]: 0}, function() {
                        console.log(username + " channel points initialised to 0");
                        //Create channel points UI element
                        createChannelPointsElement(username, 0);
                    });
                } else {
                    //Create channel points UI element based on stored value
                    let channelPoints = res[username];
                    createChannelPointsElement(username, channelPoints);
                }
            });
        }
    });

    //TODO: Initialise other UI elements as required
        //Create session points element in HTML file?
}

//TODO: create DOM element and display points value
function createTotalPointsElement(pointsValue) {
    console.log("Total points:" + pointsValue);
}

//TODO: create DOM element and display channel name and points value
function createChannelPointsElement(username, pointsValue) {
    console.log(username + " channel points: " + pointsValue);
}

function updateUI(data) {
    //Do not need to check for storage permissions as it was done in background script to pass this message
    //Update total points element
    chrome.storage.sync.get("_total", function(res) {
        let totalPoints = res["_total"];
        updateUIElementValue("total-points", totalPoints);
    });
    
    //Update channel points element
    const username = data.username;
    chrome.storage.sync.get(username, function(res) {
        let channelPoints = res[username];
        updateUIElementValue("channel-points", channelPoints);
    });
}

//TODO: Update points value of UI elements
function updateUIElementValue(elementId, pointsValue) {
    //TODO: Finish this
    console.log("Updating element: " + elementId + " to value: " + pointsValue);
    /*const element = document.getElementById(elementId);
    element.innerText = pointsValue;*/
}


//Permission request must be contained within user gesture
document.getElementById("storage-permission").addEventListener("click", function() {
    chrome.permissions.request({
        permissions: ["storage"],
        origins: ["https://www.twitch.tv/*"],

    }, function(isGranted) {
        //User grants permission
        if(isGranted) {
            //TODO: set up storage
            console.log("Permission granted!");
        } else {
            //TODO: prepare to not use storage
            console.log("Permission denied!");
        }
    });
});