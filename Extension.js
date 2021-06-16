//Get container element for channel points information
const pointsContainer = document.getElementsByClassName("sc-AxjAm bnsqjT")[0]

//TODO: perform initial check to click button if it already exists before adding observer
    //Also ensure page has fully loaded before running

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
                //TODO: may need to check for a specific node to know that it's passive points and not something in the subtree
                    //TODO: simple fix would be to check if the element has children
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

//Options for MutationObserver object
const observerConfig = {childList: true, subtree: true};

//Create MutationObserver
const observer = new MutationObserver(observerCallback);
//Observe pointsContainer with specificied configuration
observer.observe(pointsContainer, observerConfig);

//TODO: Use observer.disconnect() to stop listening at some point
