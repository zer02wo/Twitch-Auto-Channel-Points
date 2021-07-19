//Display popup content based on URL of tab accessing the menu
if(isInvalidTwitchURL()) {
    //TODO: replace HTML content when not on a valid Twitch channel URL
        //Keep donation button and similar style
} else {
    //Initiate communication between popup and content script
    initiateHandshake();
}

//Verify whether the current tab accessing popup menu is on a valid Twitch page
function isInvalidTwitchURL() {
    //Get current tab accessing popup
    getCurrentTab().then(curTab => {
        //Get URL from current tab
        const url = curTab.url;
        //Matches valid Twitch URL, ignoring "...tv/videos" and "...tv/<username>/clip/" exceptions
        const regex = /^https?:\/\/www\.twitch\.tv\/(?!videos|[a-z0-9_]+\/clip\W)[a-z0-9_]+\/?[a-z0-9_]+\/?/ig;
        //Check if URL matches regular expression
        if(url.match(regex) == null) {
            //Invalid Twitch page
            return true;
        } else {
            //Valid Twitch page
            return false;
        }
    });
}

//Listen to receive response from content script
chrome.runtime.onMessage.addListener(function(msg) {
    if(msg.user !== undefined) {
        //Initialise main UI elements
        initialiseUI(msg.user);
    } else if(msg.update !== undefined) {
        //Update main UI elements with newest values
        updateUI(msg.update);
    } else if(msg.session !== undefined) {
        //Update session points UI element with newest value
        updateUIElementValue("session-points", msg.session);
    } else if(msg.debug !== undefined) {
        //Update debug button with newest state
        updateButtonState("debug", msg.debug);
    } else if(msg.observer !== undefined) {
        //Update on-off button with newest state
        updateButtonState("on-off", msg.observer);
    }
});

//Send initial messages to content script when popup opens
function initiateHandshake() {
    //Get current tab to query content script for information
    getCurrentTab().then(curTab => {
        //Initialise the popup by communicating with content script
        chrome.tabs.sendMessage(curTab.id, "getUsername");
        chrome.tabs.sendMessage(curTab.id, "getSessionPoints");
    });
}

//Initialise UI elements
function initialiseUI(username) {
    //Get total amount of points earned using extension across all channels
    chrome.storage.sync.get("_total", function(res) {
        //Channel points have not previously been recorded
        if(Object.keys(res).length === 0) {
            //Create initial storage and set to 0
            chrome.storage.sync.set({"_total": 0}, function() {
                console.log("Total channel points initialised to 0");
                //Update total points UI element
                document.getElementById("total-points").innerText = 0;
            });
        } else {
            //Update total points UI element based on stored value
            let totalPoints = res["_total"];
            document.getElementById("total-points").innerText = totalPoints;
        }
    });

    //Get amount of points earned using extension for this channel
    chrome.storage.sync.get(username, function(res) {
        //Channel points have not previously been recorded for this channel
        if(Object.keys(res).length === 0) {
            //Create initial storage and set to 0
            chrome.storage.sync.set({[username]: 0}, function() {
                console.log(username + " channel points initialised to 0");
                //Update channel points UI element
                document.getElementById("channel-points").innerText = "0";
            });
        } else {
            //Update channel points UI element based on stored value
            let channelPoints = res[username];
            document.getElementById("channel-points").innerText = channelPoints;
        }
        //Append username to channel title element
        document.getElementById("channel-title").innerText += " " + username + ":";
    });
    
    //Set visual state of buttons from storage
    setButtonStateFromStorage("_exe", "on-off");
    setButtonStateFromStorage("_dbg", "debug");
    //Set listener events for buttons
    setButtonListeners(username);
}

//Update UI when popup is kept open using values from storage
function updateUI(data) {
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

//Updates specified points UI element with new value
function updateUIElementValue(elementId, pointsValue) {
    const element = document.getElementById(elementId);
    element.innerText = pointsValue;
}

//Updates specified button element with new state
function updateButtonState(buttonId, state) {
    const button = document.getElementById(buttonId);
    if(state == "active") {
        button.classList.add("active");
        button.classList.remove("inactive");
    } else {
        button.classList.add("inactive");
        button.classList.remove("active");
    }
}

//Set visual button state in popup menu from stored value
function setButtonStateFromStorage(objectId, buttonId) {
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

        //Update button based on state value
        if(state) {
            //Active state so set button to active class
            updateButtonState(buttonId, "active");
        } else {
            //Inactive state so set button to inactive class
            updateButtonState(buttonId, "inactive");
        }
    });
}

//Set event listeners for button controls in popup
function setButtonListeners(username) {
    //Toggle auto-clicker. Listen for click on button.
    document.getElementById("on-off").addEventListener("click", function() {
        updateStorageAndSend("_exe", "toggleObserver");
    });

    //Toggle debug mode. Listen for click on button.
    document.getElementById("debug").addEventListener("click", function() {
        updateStorageAndSend("_dbg", "toggleDebug");
    });

    //Reset points counter for current channel. Listen for click on button.
    document.getElementById("reset-channel").addEventListener("click", function() {
        //Set points value to 0
        chrome.storage.sync.set({[username]: 0}, function() {
            console.log("Reset channel points count for " + username);
            //Update UI to reflect reset value
            updateUI({username: username});
        });
    });

    //Reset points counter for total points. Listen for click on button.
    document.getElementById("reset-total").addEventListener("click", function() {
        //Set points value to 0
        chrome.storage.sync.set({"_total": 0}, function() {
            console.log("Reset total points count");
            //Update UI to reflect reset value
            updateUI({username: username});
        })
    })

    //TODO: add some sort of confirmation prompt to the reset buttons?
}

//Update stored object with id and run function by name in content script
function updateStorageAndSend(objectId, functionName) {
    //Get object state from storage by id
    chrome.storage.sync.get(objectId, function(res) {
        //Get state from storage response object
        let state = res[objectId];
        //Toggle boolean state (0 or 1)
        let newState = 1 - state;
        //Update object state within storage
        chrome.storage.sync.set({[objectId]: newState}, function() {
            console.log("Execution state updated to: " + newState);
            //Update object state within content script
            getTwitchTabs().then(ttvTabs => {
                ttvTabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {[functionName]: newState});
                });
            });
        });
    });
}

//Get current active browser tab
async function getCurrentTab() {
    //Destructure assign to get first value of array
    let [curTab] = await chrome.tabs.query({active: true, currentWindow: true, url: "*://*.twitch.tv/*"});
    //Return value after promise is resolved
    return curTab;
}

//Get all instances of Twitch tabs
async function getTwitchTabs() {
    //Query chrome for all tabs related to Twitch.tv
    let tabs = await chrome.tabs.query({url: "*://*.twitch.tv/*"});
    //Return array of tabs after promise resolves
    return tabs;
}