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

    intervalCtrl.addEventListener("change", (e) => {
        interval = e.target.value;
    });

    startingTimeCtrl.addEventListener("change", (e) => {
        startingTime = e.target.value;
        document.querySelector("#startButton").disabled = false;

        // TODO - prevent user from selecting an invalid time (e.g. "before now")
    });

    volumeCtrl.addEventListener("change", (e) => {
        bell.volume = e.target.value;
    });
}