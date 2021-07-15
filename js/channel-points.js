//TODO: set these to false by default, then query background script to get the actual value from storage???
//Debug mode for console logging
var debugMode = true;
//Mutation observer state
var isObserving = true;
//Record total amount of points earned in session (i.e. since refresh)
var sessionPoints = 0;

//Listen for messages from extension scripts
chrome.runtime.onMessage.addListener(function(msg) {
    switch(msg) {
        case "getUsername":
            //Get Twitch username and return in message
            const username = getUsername();
            chrome.runtime.sendMessage({user: username});
            break;
        case "getSessionPoints":
            //Return number of points earned this session
            chrome.runtime.sendMessage({session: sessionPoints});
            break;
        case "toggleDebug":
            //Toggle debugging state and return new state
            const debugState = toggleDebug();
            chrome.runtime.sendMessage({debug: debugState});
            break;
        case "toggleObserver":
            //Toggle auto-click on or off by toggling observation state
            const observerState = toggleObserver();
            chrome.runtime.sendMessage({observer: observerState});
            break;
        default:
            //Log any unexpected messages when in debug mode
            debugMode && console.log("Unexpected message received: " + msg);
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

//Ensure page has loaded before beginning check
window.onload = setTimeout(function() {
    //Log to console when in debug mode
    debugMode && console.log("Twitch Auto Channel Points initialised.");
    //Wait 10 seconds to allow everything to load
    initialCheck();
    //TODO: figure out more efficient method, maybe keep checking for specific element every 0.5s until it appears?
}, 10000);

//Initial check if channel points button exists before observation
function initialCheck() {
    //TODO: change this to a contains check instead?
    //Check if container element has points redeem button
    const pointsCheck = document.getElementsByClassName("sc-AxjAm bnsqjT")[0];
    if(pointsCheck !== undefined) {
        const pointsButton = pointsCheck.querySelector("button");
        if(pointsButton !== null) {
            //Click button to redeem channel points
            pointsButton.click();
        }
    }

    //Begin observing channel points
    startObserver();
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
function toggleObserver() {
    //If observer is watching for mutations
    if(isObserving) {
        //Disconnect and update state
        observer.disconnect();
        isObserving = false;
        debugMode && console.log("Auto-clicker is now off.");
    } else {
        //Start observer and update state
        initialCheck();
        isObserving = true;
        debugMode && console.log("Auto-clicker is now on.");
    }
    //Return observer state as a string value for popup
    return getStateString(isObserving);
}

//Get Twitch username as formatted within the URL
function getUsername() {
    //Get first part of URL path
    const initialSplit = window.location.href.split("twitch.tv/")[1];
    if(initialSplit.includes("/")) {
        //Remove any subsequent paths
        return initialSplit.split("/")[0];
    } else if(initialSplit.includes("?")) {
        //Remove any query strings
        return initialSplit.split("?")[0];
    } else {
        return initialSplit;
    }
}

//Toggle state of debug mode
function toggleDebug() {
    //Set debug mode to opposite of current state
    debugMode = !debugMode;
    console.log("Debug mode set to: " + debugMode);
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