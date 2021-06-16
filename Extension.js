const observerCallback = function(mutationsList) {
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
                //TODO: Twitch does not seem to have issues with instant claim, will continue monitoring
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

//Ensure page has loaded before beginning check
window.onload = initialCheck(); 

function initialCheck() {
    //Check if channel points button exists before observation
    const pointsCheck = document.getElementsByClassName("sc-AxjAm bnsqjT")[0].querySelector("button");
    if(pointsCheck !== null) {
        //Click button to redeem channel points
        pointsCheck.click();
    }

    //Begin observing channel points
    createObserver();
}

function createObserver() {
    //Get container element for channel points information
    const pointsContainer = document.getElementsByClassName("sc-AxjAm bnsqjT")[0];

    //Options for MutationObserver object
    const observerConfig = {childList: true, subtree: true};

    //Create MutationObserver
    const observer = new MutationObserver(observerCallback);
    //Observe pointsContainer with specificied configuration
    observer.observe(pointsContainer, observerConfig);
}

//TODO: create pop-up menu for extension controls: https://www.youtube.com/watch?v=YQnRSa8MGwM
    //TODO: use cookies to track total channel points earned with extension?
        //Or per session instead to remove storage need?
        //Or per channel (separate number for each channel it's been enabled on)
            //All of the above?
    //TODO: use observer.disconnect() as a button to stop auto-channel points
    //TODO: debug mode?
    //TODO: think of more features

//TODO: organise into extension format and create necessary files: https://levelup.gitconnected.com/make-your-first-chrome-extension-with-javascript-7aa383db2b03
    //TODO: manifest.json
    //TODO: rename to background.js
    //TODO: icon.png
