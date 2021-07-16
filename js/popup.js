//TODO: add functions:
    //Reset channel and/or total points
        //Probably just for debugging, but maybe a full feature

//TODO: set popup to something different when not on a live twitch channel
    //Replace with entirely different HTML file if possible? (Keep donation button and same style on this)

//Initiate communication between popup and content script
initiateHandshake();
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
                        createPointsElement("total", 0);
                    });
                } else {
                    //Create total points UI element based on stored value
                    let totalPoints = res["_total"];
                    createPointsElement("total", totalPoints);
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
                        createPointsElement("channel", 0, username);
                    });
                } else {
                    //Create channel points UI element based on stored value
                    let channelPoints = res[username];
                    createPointsElement("channel", channelPoints, username);
                }
            });
        }
    });
    //TODO: need to get state (i.e. on/off) of buttons on initial call
    //TODO: Initialise other UI elements as required
    setButtonListeners();
}

//Creates point related UI elements, appended to the DOM with updated point values
function createPointsElement(type, points, username = null) {
    //Get container element to append created elements
    const pointsContainer = document.getElementById("points-container");
    //Create container element
    const pointsDisplay = document.createElement("div");
    pointsDisplay.id = type + "-display";
    pointsDisplay.className = "points-display";
    pointsContainer.appendChild(pointsDisplay);
    //Create title/description element
    const pointsTitle = document.createElement("p");
    pointsTitle.id = type + "-title";
    pointsTitle.className = "points-title";
    //Set description based on optional parameter
    if(username == null) {
        pointsTitle.innerText = "Total points earned:";
    } else {
        pointsTitle.innerText = "Points earned for " + username + ":";
    }
    pointsDisplay.appendChild(pointsTitle);
    //Create points value element
    const pointsValue = document.createElement("p");
    pointsValue.id = type + "-points";
    pointsValue.className = "points-value";
    pointsValue.innerText = points;
    pointsDisplay.appendChild(pointsValue);
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

//Updates specified points UI element with new value
function updateUIElementValue(elementId, pointsValue) {
    const element = document.getElementById(elementId);
    element.innerText = pointsValue;
}

//Updates specified button element with new state
function updateButtonState(buttonId, state) {
    const button = document.getElementById(buttonId);
    //TODO: may need to add more states in the future
    if(state == "active") {
        button.classList.add("active");
        button.classList.remove("inactive");
    } else {
        button.classList.add("inactive");
        button.classList.remove("active");
    }
}

//Set event listeners for button controls in popup
function setButtonListeners() {
    //Toggle auto-clicker. Listen for click on button.
    document.getElementById("on-off").addEventListener("click", function() {
        //TODO: NEED TO USE STORAGE TO KEEP THESE IN SYNC
        getTwitchTabs().then(ttvTabs => {
            ttvTabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, "toggleDebug");
            });
        });
    });

    //Toggle debug mode. Listen for click on button.
    document.getElementById("debug").addEventListener("click", function() {
        //TODO: NEED TO USE STORAGE TO KEEP THESE IN SYNC
        getTwitchTabs().then(ttvTabs => {
            ttvTabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, "toggleDebug");
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