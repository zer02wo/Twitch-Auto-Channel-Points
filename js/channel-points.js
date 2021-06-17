//TODO: Debug mode for console logging
var debugMode = false;

//Record total amount of points earned in session (i.e. since refresh)
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
                    const pointsAmount = +pulseAnimation.querySelector("div.sc-AxjAm.jPJPAu").innerText;
                    //Add points to totals
                    sessionPoints += pointsAmount;
                    console.log(pointsAmount + " points added!");
                    console.log("Points for this session: " + sessionPoints);
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

//TODO: create pop-up menu for extension controls: https://www.youtube.com/watch?v=YQnRSa8MGwM https://developer.chrome.com/docs/extensions/mv3/manifest/
    //TODO: use storage API to track total channel points earned with extension?: https://developer.chrome.com/docs/extensions/reference/storage/
        //Or per channel (separate number for each channel it's been enabled on)
    //TODO: donation button

//TODO: create icon https://developer.chrome.com/docs/extensions/mv3/manifest/icons/
//TODO: create pop-up https://developer.chrome.com/docs/extensions/reference/action/
