//Initialise extension on installation
chrome.runtime.onInstalled.addListener(function(details) {
    //TODO: figure out what actions need to be performed
    if(details.reason == "install") {
        //Perform some action
        //TODO: set debugMode to off by default (can set to on)
        //TODO: set extension to on by default (can set to off)
    } else if(details.reason == "update") {
        //Perform other action
    }
});

//Listen to receive updated points information from content script
chrome.runtime.onMessage.addListener(function(msg, sender) {
    //Listen for message
    if(msg.username !== undefined && msg.points !== undefined) {
        //Message contains username and points, update values in storage
        updatePointValues(msg.username, msg.points);
    } else if(msg.handshake == "initiate") {
        //New content script has initialised, update state from storage
        setContentStateFromStorage(sender, "_exe", "toggleObserver");
        setContentStateFromStorage(sender, "_dbg", "toggleDebug");
    }
});

//Set state of content script based on stored value
function setContentStateFromStorage(sender, objectId, functionName) {
    chrome.storage.sync.get([objectId], function(res) {
        let state = 1;
        //Object state has not previously been recorded, should be done on install but precautionary measure
        if(Object.keys(res).length === 0) {
            //Create initiate storage and set to default state
            chrome.storage.sync.set({[objectId]: state}, function() {
                console.log(objectId + " state initialised.");
            });
        } else {
            //Get state from storage response object
            state = res[objectId];
        }
        //Send message to content script that initiated the handshake to update state
        chrome.tabs.sendMessage(sender.tab.id, {[functionName]: state});
    });
}

function updatePointValues(username, pointsValue) {
    //Message regarding an update in channel points
    //Get total amount of points earned using extension for this specific channel
    chrome.storage.sync.get(username, function(res) {
        //Channel points have not previously been recorded for this channel
        if (Object.keys(res).length === 0) {
            //Create initial storage for channel name and set to points amount
            chrome.storage.sync.set({[username]: pointsValue}, function () {
                console.log(username + " channel points initialised to: " + pointsValue);
            });
        } else {
            //Calculate total points for channel by adding increase to current total
            const newPoints = pointsValue + res[username];
            //Update new total points for channel in storage
            chrome.storage.sync.set({[username]: newPoints}, function () {
                console.log(username + " channel points increased now totalling: " + newPoints);
            });
        }
    });

    //Get total amount of points earned using extension across all channels
    //Use _total as key because Twitch usernames cannot begin with "_"
    chrome.storage.sync.get("_total", function(res) {
        //Channel points have not previously been recorded
        if (Object.keys(res).length === 0) {
            //Create initial storage and set to points amount
            chrome.storage.sync.set({"_total": pointsValue}, function () {
                console.log("Total channel points initialised to: " + pointsValue);
            });
        } else {
            //Calculate total points by adding increase to current total
            const newPoints = pointsValue + res["_total"];
            //Update new total points in storage
            chrome.storage.sync.set({"_total": newPoints}, function () {
                console.log("Total channel points earned with TACP is: " + newPoints);
            });
        }
    });

    //Send message to popup to update its display from storage
    const data = {
        username: username
    };
    chrome.runtime.sendMessage({update: data});
}