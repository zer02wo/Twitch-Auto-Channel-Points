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

//TODO: sets up communication with content script, this is what I'd use to update the storage (and probably the extension pop-up?) https://developer.chrome.com/docs/extensions/mv3/messaging/
chrome.runtime.onConnect.addListener(function (port) {
    //Writes error message to console if port doesn't match
        //TODO: (change this to an if statement)?
    console.assert(port.name === "channel-points");
    //Sets up listener to port
    port.onMessage.addListener(function (msg) {
        //Check if chrome has storage permissions to perform certain operations
        chrome.permissions.contains({
            permissions: ['storage'],
            origins: ["https://www.twitch.tv/*"]
        }, function(isGranted) {
            //Chrome has storage permissions
            if(isGranted) {
                //Message regarding an update in channel points
                if (msg.username && msg.points) {
                    //Get total amount of points earned using extension for this specific channel
                    chrome.storage.sync.get([msg["username"]], function(res) {
                        //Channel points have not previously been recorded for this channel
                        if(Object.keys(res).length === 0) {
                            //Create initial storage for channel name and set to points amount
                            chrome.storage.sync.set({[msg["username"]]: msg["points"]}, function() {
                                console.log(msg.username + " channel points initialised to: " + msg.points);
                            });
                        } else {
                            //Calculate totoal points for channel by adding increase to current total
                            let newPoints = msg.points + res[msg["username"]];
                            //Update new total points for channel in storage
                            chrome.storage.sync.set({[msg["username"]]: newPoints}, function() {
                                console.log(msg.username + " channel points increased now totalling: " + newPoints);
                            });
                        }
                    });
                    
                    //Get total amount of points earned using extension across all channels
                    //Use _total as key because Twitch usernames cannot begin with "_"
                    chrome.storage.sync.get("_total", function(res) {
                        //Channel points have not previously been recorded for this channel
                        if(Object.keys(res).length === 0) {
                            //Create initial storage and set to points amount
                            chrome.storage.sync.set({"_total": msg["points"]}, function() {
                                console.log("Total channel points initialised to: " + msg.points);
                            });
                        } else {
                            //Calculate total points by adding increase to current total
                            let newPoints = msg.points + res["_total"];
                            //Update new total points in storage
                            chrome.storage.sync.set({"_total": newPoints}, function() {
                                console.log("Total channel points earned with TACP is: " + newPoints);
                            });
                        }
                    });
                }
            }
        });
    });
});