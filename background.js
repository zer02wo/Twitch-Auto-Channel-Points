//Initialise extension on installation
chrome.runtime.onInstalled.addListener(function(details) {
    //TODO: figure out what actions need to be performed
    if(details.reason == "install") {
        //Perform some action
    } else if(details.reason == "update") {
        //Perform other action
    }
});

//Connect to messaging port to communicate with content script
chrome.runtime.onConnect.addListener(function(port) {
    //Writes error message to console if port doesn't match
    console.assert(port.name === "channel-points");
    //Sets up listener to port
    port.onMessage.addListener(function(msg) {
        //Check if chrome has storage permissions to perform certain operations
        chrome.permissions.contains({
            permissions: ['storage'],
            origins: ["https://www.twitch.tv/*"]
        }, function(isGranted) {
            //Chrome has storage permissions
            if(isGranted && msg.username && msg.points) {
                //Message contains username and points, update values
                updatePointValues(msg.username, msg.points);
            } else if(msg.user) {
                //Message contains username to be sent to popup
                chrome.runtime.sendMessage(msg);
            } else if(msg.session) {
                //Message contains session points to be sent to popup
                chrome.runtime.sendMessage(msg);
            }
        });
        //Chrome doesn't require storage permissions
        if(msg.debug) {
            //Message contains debug state to be sent to popup
            chrome.runtime.sendMessage(msg);
        }
    });

    //Listen to receive handshake initiation and user inputs from popup menu
    //Responses handled in port message listener
    chrome.runtime.onMessage.addListener(function(message) {
        //If message is handshake initiation
        if(message.handshake == "initiate") {
            //Initialise the popup by communicating with content script
            port.postMessage("getUsername");
            port.postMessage("getSessionPoints");
        } else if(message.debug == "toggle") {
            //Toggle debug state by communicating with content script
            port.postMessage("toggleDebug");
        }
    });
});


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
            //Calculate totoal points for channel by adding increase to current total
            const newPoints = pointsValue + res[username];
            //Update new total points for channel in storage
            chrome.storage.sync.set({[username]: newPoints }, function () {
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