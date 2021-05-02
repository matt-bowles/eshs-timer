var interval, startingTime;
var bell = new Audio("./media/bell.mp3");
 
function start() {
    // Hide configuration menu and show timer
    document.querySelector("#configContainer").style.visibility = "hidden";
    document.querySelector("#timerContainer").removeAttribute("hidden");
}

function playBell() {
    bell.play();
}

// Run once the page has loaded
window.onload = () => {
    // Define and setup input handlers
    var intervalCtrl = document.querySelector("#intervalCtrl");
    var startingTimeCtrl = document.querySelector("#startingTimeCtrl");
    var volumeCtrl = document.querySelector("#volumeCtrl");

    intervalCtrl.addEventListener("input", (e) => {
        interval = e.target.value;
    });

    startingTimeCtrl.addEventListener("input", (e) => {
        startingTime = e.target.value;
        document.querySelector("#startButton").disabled = false;

        // TODO - prevent user from selecting an invalid time (e.g. "before now")
    });

    volumeCtrl.addEventListener("input", (e) => {
        bell.volume = e.target.value;
    });

    document.querySelectorAll(".range-wrap").forEach((rangeWrap) => {
        const range = rangeWrap.querySelector(".range");
        const bubble = rangeWrap.querySelector(".bubble");

        // Reposition bubble on input change
        range.addEventListener("input", (e) => {
            setBubblePos(range, bubble);
        });

        // Show bubbles on initial pageload
        setBubblePos(range, bubble);
    });
}



function setBubblePos(range, bubble) {
    var bubbleText = range.value;   // Fallback

    if (range.name == "intervalCtrl") {
        bubbleText = `${range.value} mins`;
    }
    
    else if (range.name == "volumeCtrl") {
        bubbleText = `${range.value*100}%`
    }
    
    bubble.innerHTML = bubbleText;

    // Reposition bubble to be above the slider button
    var newVal =((range.value - range.min) * 100) / (range.max - range.min);
    bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
}