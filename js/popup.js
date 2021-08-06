//Initiate communication between popup and content script
initiateHandshake();

//Listen to receive response from content script
chrome.runtime.onMessage.addListener(function(msg) {
    if(msg.handshakeContent !== undefined) {
        //Initialise main UI elements
        initialiseUI(msg.handshakeContent);
    } else if(msg.update !== undefined) {
        //Update main UI elements with newest values
        updateUI(msg.update);
    } else if(msg.session !== undefined) {
        //Update session points UI element with newest value
        updateUIElementValue("session-points", msg.session);
    } else if(msg.debug !== undefined) {
        //Update debug button with newest state
        updateElementState("debug", msg.debug);
    } else if(msg.observer !== undefined) {
        //Update on-off button with newest state
        updateElementState("on-off", msg.observer);
    }
});

//Send initial messages to content script when popup opens
function initiateHandshake() {
    //Get current tab to query content script for information
    getCurrentTab().then(curTab => {
        //Initialise the popup by communicating with content script
        chrome.tabs.sendMessage(curTab.id, "handshakePopup");
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
                updateUIElementValue("total-points", 0);
            });
        } else {
            //Update total points UI element based on stored value
            let totalPoints = res["_total"];
            updateUIElementValue("total-points", totalPoints);
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
                updateUIElementValue("channel-points", 0);
            });
        } else {
            //Update channel points UI element based on stored value
            let channelPoints = res[username];
            updateUIElementValue("channel-points", channelPoints);
        }
        //Append username to channel title element
        document.getElementById("channel-title").innerText += " " + username + ":";
    });
    
    //Set visual state of buttons from storage
    setButtonStateFromStorage("_exe", "on-off");
    setButtonStateFromStorage("_dbg", "debug");
    //Set visual state of badge text option elements
    updateBadgeTextOptions();
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

    //Update badge text option elements
    updateBadgeTextOptions();
}

//Updates specified points UI element with new value
function updateUIElementValue(elementId, pointsValue) {
    const element = document.getElementById(elementId);
    element.innerText = pointsValue;
}

//Update badge text option UI elements from stored value
function updateBadgeTextOptions() {
    //Reset all options to inactive
    updateElementState("channel-display", "inactive");
    updateElementState("total-display", "inactive");
    updateElementState("session-display", "inactive");
    //Get badge text option from storage
    chrome.storage.sync.get("_badge", function(res) {
        const option = res["_badge"];
        //Dynamically get badge text option element ID
        const elementId = option + "-display";
        //Update active badge text option element state
        updateElementState(elementId, "active");
    });
}

//Updates specified button element with new state
function updateElementState(elementId, state) {
    const button = document.getElementById(elementId);
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
            updateElementState(buttonId, "active");
        } else {
            //Inactive state so set button to inactive class
            updateElementState(buttonId, "inactive");
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
        if(confirm("Are you sure you want to reset your points counter for " + username + "?")) {
            //Set points value to 0
            chrome.storage.sync.set({[username]: 0}, function() {
                console.log("Reset channel points count for " + username);
                //Update UI to reflect reset value
                updateUI({username: username});
                //Send message to background script to update badge text from stored values
                updateBadgeTextFromMessage(username);
            });
        }
    });

    //Reset points counter for total points. Listen for click on button.
    document.getElementById("reset-total").addEventListener("click", function() {
        if(confirm("Are you sure you want to reset your total points counter?")) {
            //Set points value to 0
            chrome.storage.sync.set({"_total": 0}, function() {
                console.log("Reset total points count");
                //Update UI to reflect reset value
                updateUI({username: username});
                //Send message to background script to update badge text from stored values
                updateBadgeTextFromMessage(username);
            });
        }
    });

    //Set badge text display to channel points. Listen for click on element.
    document.getElementById("channel-display").addEventListener("click", function() {
        //Set badge text option to channel
        chrome.storage.sync.set({"_badge": "channel"}, function() {
            console.log("Set badge text to channel");
            //Update UI to reflect updated selection
            updateUI({username: username});
            //Send message to background script to update badge text from stored values
            updateBadgeTextFromMessage(username);
        });
    });
    //Set badge text display to total points. Listen for click on element.
    document.getElementById("total-display").addEventListener("click", function() {
        //Set badge text option to total
        chrome.storage.sync.set({"_badge": "total"}, function() {
            console.log("Set badge text to total");
            //Update UI to reflect updated selection
            updateUI({username: username});
            //Send message to background script to update badge text from stored values
            updateBadgeTextFromMessage();
        });
    });
    //Set badge text display to session points. Listen for click on element.
    document.getElementById("session-display").addEventListener("click", function() {
        //Set badge text to session
        chrome.storage.sync.set({"_badge": "session"}, function() {
            console.log("Set badge text to session");
            //Update UI to reflect updated selection
            updateUI({username: username});
            //Send message to background script to update badge text from stored values
            updateBadgeTextFromMessage();
        });
    });
}

//Send message to background script to update badge text display
function updateBadgeTextFromMessage(username = undefined) {
    //Get current active browser tab using popup
    getCurrentTab().then(curTab => {
        if(username == undefined) {
            //Send message without optional username parameter
            chrome.runtime.sendMessage({updateBadgeTextFromStorage: curTab.id});
        } else {
            //Send message with username parameter
            chrome.runtime.sendMessage({updateBadgeTextFromStorage: curTab.id, username: username});
        }
    });
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