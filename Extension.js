//TODO: unsure if this is consistent with all Twitch accounts
const pointsContainer = document.getElementsByClassName("sc-AxjAm bnsqjT")[0]

//TODO: perform initial check to click button if it already exists before adding observer
    //Also ensure page has fully loaded before running

const observerCallback = function(mutationsList) {
    //TODO: update this to be more specific
    console.log("An update has been observed!");
    for(const mutation of mutationsList) {
        //TODO: figure out how to check how many points are being added
        if(mutation.addedNodes.length > 0) {
            const innerContainer = mutation.addedNodes[0];
            if(innerContainer.querySelector("button") !== null) {
                //TODO: Be more specific than button maybe? Will have: arial-label="Claim Bonus"
                const pointsButton = innerContainer.getElementsByTagName("button")[0];
                //TODO: Figure out how to check how many points are added
                console.log("Auto-clicked channel points prompt! __ points added!")
                //TODO: may need to add base "wait" time + some random element in case Twitch blocks it
                pointsButton.click();

                //TODO: currently does the click, then the pulse-animation makes it do the passive points as well (despite the points not being passive)
                    //Could just display the number of points in the else statement only and just set the log to "Auto-clicked channel points prompt!"
            } else {
                //TODO: may need to check for a specific node to know that it's passive points and not something in the subtree
                    //TODO: simple fix would be to check if the element has children
                //Get pulse animation element
                const pulseAnimation = mutation.addedNodes[0].querySelector(".pulse-animation");
                //Retrieve number of channel points earned
                const pointsAmount = pulseAnimation.querySelector("div.sc-AxjAm.jPJPAu").innerText;
                console.log(+pointsAmount + " passive points added!");
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

//TODO: Use observer.disconnect() to stop listening at some point?
