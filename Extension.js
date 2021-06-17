//TODO: Debug mode for console logging
var debugMode = false;

//TODO: Record total amount of points earned in session (i.e. last refresh)
var sessionPoints = 0;

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
                console.log("Auto-clicked channel points prompt!")
            } else {
                //Get pulse animation element
                const pulseAnimation = mutation.addedNodes[0].querySelector(".pulse-animation");
                if(pulseAnimation !== undefined) {
                    //Retrieve number of channel points earned
                    const pointsAmount = pulseAnimation.querySelector("div.sc-AxjAm.jPJPAu").innerText;
                    console.log(+pointsAmount + " points added!");
                }
            }
        }
    }
}

//Create global MutationObserver
const observer = new MutationObserver(observerCallback);

//Ensure page has loaded before beginning check
window.onload = initialCheck(); 

//Initial check if channel points button exists before observation
function initialCheck() {
    //Check if container element has points redeem button
    const pointsCheck = document.getElementsByClassName("sc-AxjAm bnsqjT")[0].querySelector("button");
    if(pointsCheck !== null) {
        //Click button to redeem channel points
        pointsCheck.click();
    }

    //Begin observing channel points
    createObserver();
}

//Set up MutationObserver on points container element 
function createObserver() {
    //Get container element for channel points information
    const pointsContainer = document.getElementsByClassName("sc-AxjAm bnsqjT")[0];

    //Options for MutationObserver object
    const observerConfig = {childList: true, subtree: true};

    //Observe pointsContainer with specificied configuration
    observer.observe(pointsContainer, observerConfig);
}

//TODO: figure out how to get observer here
function disconnectObserver() {
    observer.disconnect()
}

//TODO: create pop-up menu for extension controls: https://www.youtube.com/watch?v=YQnRSa8MGwM
    //TODO: use cookies to track total channel points earned with extension?
        //Or per channel (separate number for each channel it's been enabled on)
    //TODO: use observer.disconnect() as a button to stop auto-channel points
    //TODO: donation button

//TODO: organise into extension format and create necessary files: https://levelup.gitconnected.com/make-your-first-chrome-extension-with-javascript-7aa383db2b03
    //TODO: manifest.json
    //TODO: rename to background.js
    //TODO: icon.png
