//Initialise extension on installation
chrome.runtime.onInstalled.addListener(function(details) {
    //First time set up for state storage
    if(details.reason == "install") {
        //Create storage for execution state and set to default of on
        initialiseStorage("_exe");
        //Create storage for debug mode state and set to default of off
        initialiseStorage("_dbg");
    } else if(details.reason == "update") {
        //Check storage for execution state still exists after update
        checkStorage("_exe");
        //Check storage for debug mode state still exists after update
        checkStorage("_dbg");
    }
    //Set badge colour to Twitch-themed background
    chrome.action.setBadgeBackgroundColor({color: "#9147FF"});
});

//Create initial storage object and set to specified state
function initialiseStorage(objectId) {
    //Set default state based on object ID
    const state = (objectId == "_exe") ? 1 : 0; 
    //Create storage for object ID with value of state
    chrome.storage.sync.set({[objectId]: state}, function() {
        console.log(objectId + " state storage initialised");
    });
}

//Check storage object exists and recreate it as necessary
function checkStorage(objectId) {
    //Attempt to get object from storage by ID
    chrome.storage.sync.get(objectId, function(res) {
        //Storage variable does not exist
        if(Object.keys(res).length === 0) {
            //Create initial storage object for ID
            initialiseStorage(objectId);
        }
    });
}

//Listen to receive updated points information from content script
chrome.runtime.onMessage.addListener(function(msg, sender) {
    //Listen for message
    if(msg.username !== undefined && msg.points !== undefined) {
        //Message contains username and points, update values in storage
        updatePointValues(msg.username, msg.points);
    } else if(msg.handshake == "initiate") {
        //New content script has initialised, update state from storage
        setContentStateFromStorage(sender, "_dbg", "toggleDebug");
        setContentStateFromStorage(sender, "_exe", "toggleObserver");
        //Request session points from content script
        chrome.tabs.sendMessage(sender.tab.id, "getSessionPoints");
        //Enable popup upon handshake initiation
        chrome.action.setPopup({
            popup: "popup.html",
            tabId: sender.tab.id
        });
    } else if(msg.session !== undefined) {
        //Format session points as a string value
        const sessionString = formatBadgeString(msg.session);
        //Set badge text as 
        chrome.action.setBadgeText({
            text: sessionString,
            tabId: sender.tab.id
        });
    }
});

//Format points value to be presented in extension badge
function formatBadgeString(points) {
    if(points >= 1000000) {
        //1 million or more points
        return (Math.abs(points)/1000000).toFixed(1) + "M";
    } else if(points >= 1000) {
        //1 thousand or more points
        return (Math.abs(points)/1000).toFixed(0) + "K";
    } else {
        //999 or less points
        return "" + points;
    }
}

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

//Listen to receive updates from changes in tabs
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //Ignore update events not related to Twitch pages
    if(tab.url.indexOf("twitch.tv") == -1) {
        return;
    }
    //If tab update is regarding a change in URL
    if(changeInfo.url) {
        //Inform content script associated with tab
        console.log("Twitch URL updated to " + changeInfo.url);
        chrome.tabs.sendMessage(tabId, "urlUpdate");
        //Remove popup upon changing URL
        chrome.action.setPopup({
            popup: "",
            tabId: tabId
        });
        //Remove badge upon changing URL
        chrome.action.setBadgeText({
            text: "",
            tabId: tabId
        });
    }
});