//Debug mode for console logging
var debugMode = false;
//Mutation observer state
var isObserving = false;
//Record total amount of points earned in session (i.e. since refresh)
var sessionPoints = 0;

//Listen for messages from extension scripts
chrome.runtime.onMessage.addListener(function(msg) {
    if(msg.toggleObserver !== undefined) {
        //Set auto-click on or off by toggling observation state
        const observerState = toggleObserver(msg.toggleObserver);
        chrome.runtime.sendMessage({observer: observerState});
    } else if(msg.toggleDebug !== undefined) {
        //Set console logging on or off by toggling debugging state
        const debugState = toggleDebug(msg.toggleDebug);
        chrome.runtime.sendMessage({debug: debugState});
    } else if(msg == "getSessionPoints") {
        //Return number of points earned this session
        chrome.runtime.sendMessage({session: sessionPoints});
    } else if(msg == "getUsername") {
        //Get Twitch username and return in message
        const username = getUsername();
        chrome.runtime.sendMessage({user: username});
    } else {
        //Log any unexpected messages when in debug mode
        debugMode && console.log("Unexpected extension message received:\n" , msg);
    }
});

//Callback function for MutationObserver
function observerCallback(mutationsList) {
    //For each observed mutation
    for(const mutation of mutationsList) {
        //If node added in observed mutation
        if(mutation.addedNodes.length > 0) {
            //Get node added in observed mutation
            const innerContainer = mutation.addedNodes[0];
            //If node contains a button
            if(innerContainer.querySelector("button") !== null) {
                //Get points button element
                const pointsButton = innerContainer.getElementsByTagName("button")[0];
                //Click button element to redeem channel points
                pointsButton.click();
                //Log to console when in debug mode
                debugMode && console.log("Auto-clicked channel points prompt!");
            } else {
                //Get pulse animation element
                const pulseAnimation = innerContainer.querySelector(".pulse-animation");
                if(pulseAnimation !== null) {
                    //Retrieve number of channel points earned
                    const pointsAmount = +pulseAnimation.querySelector("div.sc-AxjAm.jPJPAu").innerText;
                    //TODO: Test to see if channel point bets are different format (i.e. 4.5K, 6.7M, etc)
                        //Should passive points and betting even be counted anyway? Only count on the auto click?
                        //Does betting also subtract points if losing?

                    //TODO: click prompt gives 50 base with 1.2x, 1.4x and 2x multipliers for each subscription tier
                        //No other prompts have point values of 50, 60, 70 or 100
                            //Except betting points have a possibility, but still unsure if they show in the same menu with the same prompt
                    //Add points to totals
                    sessionPoints += pointsAmount;
                    //Send message to background script to update point totals
                    const username = getUsername();
                    chrome.runtime.sendMessage({username: username, points: pointsAmount});
                    //Log to console when in debug mode
                    debugMode && console.log(pointsAmount + " points added!\nPoints for this session: " + sessionPoints);
                    //Send message to background to update popup with session points
                    chrome.runtime.sendMessage({session: sessionPoints});
                }
            }
        }
    }
}

//Create global MutationObserver
const observer = new MutationObserver(observerCallback);

window.onload = function() {
    var interval = setInterval(function() {
        //Returns true when required DOM element loads
        if(initialCheck()) {
            //Log to console regardless of debug mode
            console.log("Twitch Auto Channel Points initialised.");
            //Initiate handshake with background script to initialise observation and debugging state from storage
            chrome.runtime.sendMessage({handshake: "initiate"});
            //Stop interval function from repeating any further
            clearInterval(interval);
        }
        //Attempt to initialise extension every 200ms
    }, 200);
}

//Initial check if channel points button exists before observation
function initialCheck() {
    //Check if container element exists
    const pointsCheck = document.getElementsByClassName("sc-AxjAm bnsqjT")[0];
    if(pointsCheck !== undefined) {
        //Begin observing channel points
        startObserver();
        //Check if container element has points redeem button
        const pointsButton = pointsCheck.querySelector("button");
        if(pointsButton !== null) {
            //Click button to redeem channel points
            pointsButton.click();
        }
        return true;
    } else {
        //Container element does not exist
        return false;
    }
}

//Set up observer to watch for mutations on channel points
function startObserver() {
    //Get container element for channel points information
    const pointsContainer = document.getElementsByClassName("sc-AxjAm bnsqjT")[0];

    //Options for MutationObserver object
    const observerConfig = {childList: true, subtree: true};

    //Observe pointsContainer with specificied configuration
    observer.observe(pointsContainer, observerConfig);
}

//Toggle observer to start/stop watching for mutations
function toggleObserver(isOn) {
    //Update observer based on message passed from popup
    if(isOn) {
        //Start observer and update local state
        initialCheck();
        isObserving = true;
        debugMode && console.log("Auto-clicker is now on.");
    } else {
        //Disconnect observer and update local state
        observer.disconnect();
        isObserving = false;
        debugMode && console.log("Auto-clicker is now off.");
    }
    //Return observer state as a string value for popup
    return getStateString(isObserving);
}

//Get Twitch username as formatted within the URL
function getUsername() {
    //Get URL from window location object
    const url = window.location.href;
    //Match characters after "twitch.tv/", excluding the word "videos"
    const regex = /(?<=twitch\.tv\/(?!videos\W))[a-z0-9_]+/ig;
    //Return username
    const [username] = url.match(regex);
    return username;
}

//Toggle state of debug mode console logging
function toggleDebug(isOn) {
    //Update debug mode based on message passed from popup
    if(isOn) {
        //Update local state and log to console
        debugMode = true;
        console.log("Debug mode is now on. Logging to console.");
    } else {
        //Update local state and log to console
        debugMode = false;
        console.log("Debug mode is now off. No longer logging to console.");
    }
    //Return debug state as a string value for popup
    return getStateString(debugMode);
}

//Get state string from boolean
function getStateString(boolean) {
    //Return state string from boolean value
    if(boolean) {
        return "active";
    } else {
        return "inactive";
    }
}

//TODO: FIX BUG WHEN CHANGING CHANNELS (i.e. clicking usernames) (ALSO RAIDING)
    //Need to re-perform initial check? More complex than this?