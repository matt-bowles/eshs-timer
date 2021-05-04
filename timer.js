var interval = 10;
var startingTime;
var sessStart, sessEnd;
var bell = new Audio("./media/bell.mp3");

var i = 0;

/**
 * The core logic loop of the program.
 */
function start() {
    // Hide configuration menu and show timer
    document.querySelector("#configContainer").style.visibility = "hidden";
    document.querySelector("#timerContainer").removeAttribute("hidden");

    var startingTimeHour = startingTime.split(":")[0];
	var startingTimeMin = startingTime.split(":")[1];

    // Time formatting and padding bullshit
    setStartingTimeText();

    var date = new Date();
    var msToStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startingTimeHour, startingTimeMin, 0, 0) - Date.now();

    // Update current time clock every second
    setInterval(() => {
        var now = new Date();
        document.querySelector("#currentTime").textContent = `${pad(downTo2(now.getHours()))}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    }, 100);

    setTimeout(() => {

        sessEnd = addMins(interval);

        playBell();
        newSession(interval);

        // Get rid of the starting at "hh:mm" text
        document.querySelector("#startingTime").parentNode.style.visibility = "hidden";

    }, msToStart);
}

/**
 * Starts a new "session"
 *  - plays the bell sound
 *  - begins a new session
 *  - updates the current session text on-screen
 */
function newSession() {
    
    sessStart = addMins(i*interval);
    sessEnd = addMins((i+1)*interval);

    document.querySelector("#sessStart").textContent = sessStart;
    document.querySelector("#sessEnd").textContent = sessEnd;

    i += 1;

    setTimeout(() => {
        playBell();
        newSession();
    }, interval*60*1000);
}

/**
 * Adds a specified number of minutes to the starting time and then returns the result ().
 * @param {*} numMins The number of minutes to be added to the starting time.
 * @returns 
 */
function addMins(numMins) {
    var stHrs = Number(startingTime.substr(0, 2));
    var stMins = Number(startingTime.substr(3, 2));

    stMins += numMins;

    while (stMins >= 60) {
        stHrs = Number(stHrs) + 1;
        stMins -= 60;
    }

    if (stMins == 60) {
        stMins = 0;
    }

    return `${pad(downTo2(stHrs))}:${pad(stMins)}`;
}

/**
 * Pads a number with a leading 0, so that it is 2 digits.
 * @param {*} num a value representing a minute or an hour
 * @returns String
 */
function pad(num) {
    if (num < 10) {
        return `0${num}`
    } else {
        return String(num);
    }
}

/**
 * Reformats an hour value to not exceed 12 - e.g. 14 --> 2
 * @param {*} hr Hour value (ranging from 00 - 23)
 * @returns 
 */
function downTo2(hr) {
    if (hr > 12) {
        return String(hr-12);
    } else {
        return hr;
    }
}

function setStartingTimeText() {
    if (Number(startingTime.substr(0, 2)) > 12) {
        var temp = String(Number(startingTime.substr(0, 2) - 12));
        temp = pad(temp);

        // TODO: Needs AM, too
        startingTime = `${temp}:${startingTime.substr(3, 5)} PM`;

        if ((startingTime.substr(0, 2)).includes(":")) {
            startingTime = pad(startingTime);
        }
    } else if (startingTime.substr(0, 2) == 12) {
        startingTime += " PM";
    } else {
        startingTime += " AM";
    }

    document.querySelector("#startingTime").textContent = startingTime;
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