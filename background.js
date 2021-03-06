//Initialise extension on installation
chrome.runtime.onInstalled.addListener(function(details) {
    //First time set up for state storage
    if(details.reason == "install") {
        //Create storage for execution state and set to default of on
        initialiseStorage("_exe");
        //Create storage for debug mode state and set to default of off
        initialiseStorage("_dbg");
        //Create storage for badge text state and set to default of session
        initialiseStorage("_badge");
    } else if(details.reason == "update") {
        //Check storage for execution state still exists after update
        checkStorage("_exe");
        //Check storage for debug mode state still exists after update
        checkStorage("_dbg");
        //Check storage for badge text state still exists after update
        checkStorage("_badge");
    }
});

//Create initial storage object and set to specified state
function initialiseStorage(objectId) {
    //Set default state based on object ID
    let state;
    if(objectId == "_exe") {
        state = 1;
    } else if(objectId == "_badge") {
        state = "session";
    } else {
        state = 0;
    }
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
        updatePointValues(msg.username, msg.points, sender);
    } else if(msg.handshake == "initiate") {
        //New content script has initialised, update state from storage
        setContentStateFromStorage(sender, "_dbg", "toggleDebug");
        setContentStateFromStorage(sender, "_exe", "toggleObserver");
        //Request session points from content script, required to initialise badge text
        chrome.tabs.sendMessage(sender.tab.id, "getSessionPoints");
        //Request username from content script, required to initialise badge text
        chrome.tabs.sendMessage(sender.tab.id, "getUsername");
        //Enable popup upon handshake initiation
        chrome.action.setPopup({
            popup: "popup.html",
            tabId: sender.tab.id
        });
        //Set icon to be non-"greyed-out"
        chrome.action.setIcon({
            path: "images/icon32.png",
            tabId: sender.tab.id
        });
    } else if(msg.session !== undefined) {
        //Update badge text with session points value
        updateBadgeText("session", msg.session, sender.tab.id);
    } else if(msg.updateBadgeTextFromStorage !== undefined && msg.username !== undefined) {
        //Update badge text from stored values with optional username parameter supplied
        updateBadgeTextFromStorage(msg.updateBadgeTextFromStorage, msg.username);
    } else if(msg.updateBadgeTextFromStorage !== undefined) {
        //Update badge text from stored value
        updateBadgeTextFromStorage(msg.updateBadgeTextFromStorage);
    } else if(msg.username !== undefined) {
        //Set initial badge text after requesting username from content script
        updateBadgeTextFromStorage(sender.tab.id, msg.username);
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

function updatePointValues(username, pointsValue, sender) {
    //Message regarding an update in channel points
    //Get total amount of points earned using extension for this specific channel
    chrome.storage.sync.get(username, function(res) {
        //Channel points have not previously been recorded for this channel
        if (Object.keys(res).length === 0) {
            //Create initial storage for channel name and set to points amount
            chrome.storage.sync.set({[username]: pointsValue}, function () {
                console.log(username + " channel points initialised to: " + pointsValue);
            });
            //Update badge text with initial channel points value
            updateBadgeText("channel", pointsValue, sender.tab.id);
        } else {
            //Calculate total points for channel by adding increase to current total
            const newPoints = pointsValue + res[username];
            //Update new total points for channel in storage
            chrome.storage.sync.set({[username]: newPoints}, function () {
                console.log(username + " channel points increased now totalling: " + newPoints);
            });
            //Update badge text with channel points value
            updateBadgeText("channel", newPoints, sender.tab.id);
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
            //Update badge text with initial total points value
            updateBadgeText("total", pointsValue, sender.tab.id);
        } else {
            //Calculate total points by adding increase to current total
            const newPoints = pointsValue + res["_total"];
            //Update new total points in storage
            chrome.storage.sync.set({"_total": newPoints}, function () {
                console.log("Total channel points earned with TACP is: " + newPoints);
            });
            //Update badge text with total points value
            updateBadgeText("total", newPoints, sender.tab.id);
        }
    });

    //Send message to popup to update its display from storage
    const data = {
        username: username
    };
    chrome.runtime.sendMessage({update: data});
}

//Update badge text for tab based on stored object value and provided points amount
function updateBadgeText(option, points, tabId) {
    //Get badge text option from storage
    chrome.storage.sync.get("_badge", function(res) {
        //If stored value is equal to option
        if(res["_badge"] == option) {
            //Format session points as a string value
            const badgeString = formatBadgeString(points);
            //Set badge text as identifier's points value
            chrome.action.setBadgeText({
                text: badgeString,
                tabId: tabId
            });
        }
    });
    //Set badge colour to Twitch-themed background
    chrome.action.setBadgeBackgroundColor({color: "#9147FF"});
}

//Update badge text display value from stored values
function updateBadgeTextFromStorage(tabId, username = undefined) {
    //Get badge text option from storage
    chrome.storage.sync.get("_badge", function(resBdg) {
        //Update badge text according to stored badge option value
        if(resBdg["_badge"] == "channel" && username !== undefined) {
            //Get channel points for username from storage
            chrome.storage.sync.get(username, function(resCha) {
                //Set badge text with point values from storage
                updateBadgeText("channel", resCha[username], tabId);
            });
        } else if(resBdg["_badge"] == "total") {
            //Get total channel points from storage
            chrome.storage.sync.get("_total", function(resTot) {
                //Set badge text with point values from storage
                updateBadgeText("total", resTot["_total"], tabId);
            });
        } else if(resBdg["_badge"] == "session") {
            //Request session points from content script, setting badge text handled in response
            chrome.tabs.sendMessage(tabId, "getSessionPoints");
        }
    });
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
        //Set icon to "greyed-out" upon changing URL
        chrome.action.setIcon({
            path: "images/grey-icon32.png",
            tabId: tabId
        });
    }
});