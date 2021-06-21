//Debug mode for console logging
var debugMode = true;

//Record total amount of points earned in session (i.e. since refresh)
var sessionPoints = 0;

//Set up messaging port for extension scripts
var port = chrome.runtime.connect({name: "channel-points"});
//Listen for messages on the port
port.onMessage.addListener(function(msg) {
    //TODO: Implement message listening functionality
    if(msg.keyword == "Message received") {
        //Example of using keyword from message
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
                debugMode && console.log("Auto-clicked channel points prompt!")
            } else {
                //Get pulse animation element
                const pulseAnimation = innerContainer.querySelector(".pulse-animation");
                if(pulseAnimation !== null) {
                    //Retrieve number of channel points earned
                    const pointsAmount = +pulseAnimation.querySelector("div.sc-AxjAm.jPJPAu").innerText;
                    //Add points to totals
                    sessionPoints += pointsAmount;
                    //Send message to background script to update point totals
                    const username = document.querySelector(".channel-info-content").querySelector("h1").innerText;
                    port.postMessage({username: username, points: pointsAmount});
                    //Log to console when in debug mode
                    debugMode && console.log(pointsAmount + " points added!\nPoints for this session: " + sessionPoints);
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
    //Wait 5 seconds to allow everything to load
    initialCheck();
}, 5000);

//Initial check if channel points button exists before observation
function initialCheck() {
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

//Disconnect observer to stop watching for mutations
function disconnectObserver() {
    observer.disconnect();
}

//TODO: Ensure content script operating correctly: https://developer.chrome.com/docs/extensions/mv3/content_scripts/