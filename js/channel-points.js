//Debug mode for console logging
var debugMode = false;
//Mutation observer state
var isObserving = false;
//Record total amount of points earned in session (i.e. since refresh)
var sessionPoints = 0;

window.onload = loadingCheck();

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
    } else if(msg == "urlUpdate") {
        //Perform initialisation after tab URL has updated
        loadingCheck();
    } else {
        //Log any unexpected messages when in debug mode
        debugMode && console.log("Unexpected extension message received:\n" , msg);
    }
});

//Callback function for MutationObserver facilitating root element loading
function rootObserverCallback(mutationsList, rootObserver) {
    //Root element updated, check for existence of points wrapper element
    const pointsWrapper = document.getElementsByClassName("chat-input__buttons-container")[0];
    //If points wrapper element exists
    if(pointsWrapper !== undefined) {
        //Stop listening for future mutation events
        rootObserver.disconnect();
        //Set up more precise MutationObserver to reduce resource usage
        const loadingObserver = new MutationObserver(loadingObserverCallback);
        //Options for MutationObserver object
        const loadingConfig = {childList: true, subtree: true};
        //Unpartnered Twitch channels do not have access to channel-points and thus the "community-points-summary" element may not ever load
            //This more precise observer improves performance by not firing upon every change to the root element (e.g. every Twitch chat message)
        loadingObserver.observe(pointsWrapper, loadingConfig);
    }
}

//Callback function for MutationObserver facilitating points element loading
function loadingObserverCallback(mutationsList, loadingObserver) {
    //Points wrapper element updated, check for existence of points summary element
    if(isElementLoaded(".community-points-summary")) {
        //Stop listening for future mutation events
        loadingObserver.disconnect();
        //Set up auto-clicker functionality whilst debouncing multiple sequential calls
        debouncedSetUp();
    }
}

//Set up auto-clicking behaviour for first time on valid Twitch page
function setUpAutoClicker() {
    //Perform initial check and set up auto-clicker
    initialCheck();
    //Log to console regardless of debug mode
    console.log("Twitch Auto Channel Points initialised for " + getUsername());
    //Initiate handshake with background script to initialise observation and debugging state from storage
    chrome.runtime.sendMessage({handshake: "initiate"});
}

//Callback function for MutationObserver facilitating auto-clicker
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
                    //Retrieve amount of channel points earned
                    const pointsStr = +pulseAnimation.querySelector("div").innerText;
                    //Format channel points to numeric value
                    const pointsNum = formatPoints(pointsStr);           
                    //Add points to total
                    sessionPoints += pointsNum;
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

//Format points from mutation event to numeric value
function formatPoints(pointsStr) {
    //Remove commas from string
    var num = pointsStr.replace(/,/g, "");
    //Unsure if prediction results are truncated with "K" or "M" for large integers, implemented as precautionary measure until able to test
    if(num.indexOf("K") !== -1) {
        //Remove letter from string
        num = pointsAmount.replace(/k/ig, "");
        //Re-append the truncated digits
        num = num + "000";
    } else if(num.indexOf("M") !== -1) {
        //Remove letter from string
        num = pointsAmount.replace(/m/ig, "");
        //Re-append the truncated digits
        num = num + "000000";
    }
    //Return points value as number
    return +num;
}

//Wait for Twitch page to dynamically load all elements before performing points check
function loadingCheck() {
    //Do not load rootObserver on invalid Twitch pages to reduce resource usage
    if(window.location.href.indexOf(".tv/videos/") !== -1 || window.location.href.indexOf("/clip/") !== -1) {
        return;
    }

    //Perform precursory check that element has not already been loaded
        //Prevents rootObserver restarting on URL change (whilst the page is kept loaded)
    if(!isElementLoaded(".community-points-summary")) {
        //Create MutationObserver for root element
        const rootObserver = new MutationObserver(rootObserverCallback);
        //Get root element (the first/only loaded element)
        const rootElement = document.getElementById("root");
        //Options for MutationObserver object
        const rootConfig = {childList: true, subtree: true};
        //Observe root element with specificed configuration
        rootObserver.observe(rootElement, rootConfig);
    }
}

//Check whether an element exists in the class
function isElementLoaded(identifier) {
    const element = document.querySelector(identifier);
    if(element == null) {
        return false;
    } else {
        return true;
    }
}

//Initial check if channel points button exists before observation
function initialCheck() {
    //Check if container element exists
    const pointsSummary = document.getElementsByClassName("community-points-summary")[0];
    if(pointsSummary !== undefined) {
        //Begin observing channel points
        startObserver();
        //Check if inner container element has points redeem button
        const pointsCheck = pointsSummary.children[1];
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

//Create global MutationObserver
const observer = new MutationObserver(observerCallback);

//Set up observer to watch for mutations on channel points
function startObserver() {
    //Get container element for channel points information
    const pointsContainer = document.getElementsByClassName("community-points-summary")[0].children[1];
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
        debugMode && console.log("Auto-clicker is on.");
    } else {
        //Disconnect observer and update local state
        observer.disconnect();
        isObserving = false;
        debugMode && console.log("Auto-clicker is off.");
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
        console.log("Debug mode is on. Logging to console.");
    } else {
        //Update local state and log to console
        debugMode = false;
        console.log("Debug mode is off. No longer logging to console.");
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

//Group multiple sequential calls into single one 
function debounce(func, delay) {
    //Time function was last executed
    var lastExecution = 0;
    //Return debounced function
    return function debouncedFunc() {
        //If time since last execution is greater than delay
        if (Date.now() - lastExecution > delay) {
            //Make single call to function
            func();
        }
        //Set time of last execution to current time
        lastExecution = Date.now();
    };
}
//Debounced function for setting up auto-clicker
var debouncedSetUp = debounce(setUpAutoClicker, 1000);