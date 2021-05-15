var interval = 10;
var sessStart, sessEnd;
var startingTime;
var mode;
var bell = new Audio("./media/bell.mp3");
var examBlocks = [];

// Timer mode enums
const modes = {"INTERVIEW": 1, "EXAM": 2};
Object.freeze(modes);

// set default mode
mode = modes.INTERVIEW;

// Input control references
var intervalCtrl, startingTimeCtrl, volumeCtrl, blockCtrl, modeCtrl;

// Interview only - used to keep count of the current session number 
var i = 0;

// Templates
var rowTemplate;


/**
 * The core logic loop of the program.
 */
function start() {

    // Hide scrollbar
    document.getElementsByTagName("html")[0].style.overflow = "hidden";
	
	// Hide mouse cursor
	document.getElementsByTagName("html")[0].style.cursor = "none";

    // Make page fullscreen
    document.documentElement.requestFullscreen();
	
	// Hide config screen
	document.querySelector("#configContainer").style.visibility = "hidden";
	
	var startingTimeHour = startingTime.split(":")[0];
	var startingTimeMin = startingTime.split(":")[1];

    // Time formatting and padding bullshit
    setStartingTimeText();

	// Show appropriate timer screen
	if (mode == modes.INTERVIEW) {
		document.querySelector("#interviewTimerContainer").removeAttribute("hidden");
	}
	else if (mode == modes.EXAM) {
		document.querySelector("#examTimerContainer").removeAttribute("hidden");
		setExamBlocksText(examBlocks);
	}
	
	// Get num of seconds until the countdown starts (i.e. num ms to specified "starting time")
    var date = new Date();
    var msToStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startingTimeHour, startingTimeMin, 0, 0) - Date.now();

	// The core logic  that is initiated at the starting time
    setTimeout(() => {

        playBell();
		
		if (mode == modes.INTERVIEW) {
			sessEnd = addMins(startingTime, interval);
			newInterviewSession(interval);

			// Get rid of the starting at "hh:mm" text
			document.querySelector("#startingTime").parentNode.style.display = "none";
		}
		else if (mode == modes.EXAM) {
			// The exam has started, so mark the first "block" as active
			document.querySelector(".block:nth-child(1)").classList.add("block-active");
			
			// Begin the actual exam timer here
			newExamSession(1);
		}
    }, msToStart);


	// Update current time clock every second
	startClock();
}

/**
 * Updates the clock every 0.1s (for improved accuracy) 
 */
function startClock() {

	// TODO: reduce to one clock shared between both modes
	var clocks = document.querySelectorAll(".currentTime");

	setInterval(() => {
		var now = new Date();
		clocks.forEach(c => c.textContent = `${pad(convertTo12hrs(now.getHours()))}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`)
	}, 100);
}

/**
 * Starts a new "session"
 *  - plays the bell sound
 *  - begins a new session
 *  - updates the current session text on-screen
 */
function newInterviewSession() {
    
    sessStart = addMins(startingTime, i*interval);
    sessEnd = addMins(startingTime, (i+1)*interval);

    document.querySelector("#sessStart").textContent = sessStart;
    document.querySelector("#sessEnd").textContent = sessEnd;

    i += 1;

    setTimeout(() => {
        playBell();
        newInterviewSession();
    }, interval*60*1000);
}

/**
* Creates the elements located on the left hand-side of the screen that indicates the different "blocks". 
*/
function setExamBlocksText(eb) {

	var blockTemplate = document.querySelector("#blockTemplate");

	var blockEnd = startingTime;
	
	eb.forEach((examBlock) => {

		// Create unique clone of block template
		var content = document.importNode(blockTemplate.content, true);
		
		// Populate the clone with relevent block information (e.g. Reading-only)
		content.querySelector(".blockName").textContent = examBlock.text;
		
		var blockStart = blockEnd;

		blockEnd = addMins(blockEnd, examBlock.duration);
		
		content.querySelector(".blockStart").textContent = blockStart;
		content.querySelector(".blockEnd").textContent = blockEnd;
		
		// Add cloned template to page
		document.querySelector("#blocks").appendChild(content);
	});
}

function newExamSession(index) {
	
	// Done
	if (index > examBlocks.length) {
		alert("Done")
	}
	
	// Recursively run all of the required timer blocks.
	setTimeout(() => {

		playBell();
		
		// Stikeout the last block when it has finished playing, and revert back to normal text
		document.querySelector(`.block:nth-child(${index})`).style.textDecoration = "line-through";
		document.querySelector(`.block:nth-child(${index})`).classList.remove("block-active");
		
		// Add active to block
		document.querySelector(`.block:nth-child(${index + 1})`).classList.add("block-active");
		
		// **the recursive call**
		newExamSession(index + 1);

    }, examBlocks[index].duration * 1000 * 60);
}

/**
 * Adds a specified number of minutes to the starting time and then returns the result ().
 * @param {*} numMins The number of minutes to be added to the starting time.
 * @returns a string of the formatted time
 */
function addMins(time, numMins) {
    var stHrs = Number(time.substr(0, 2));
    var stMins = Number(time.substr(3, 2));

    stMins += Number(numMins);

    while (stMins >= 60) {
        stHrs = Number(stHrs) + 1;
        stMins -= 60;
    }

    if (stMins == 60) {
        stMins = 0;
    }

    return `${pad(convertTo12hrs(stHrs))}:${pad(stMins)}`;
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
function convertTo12hrs(hr) {
	return (hr > 12) ? String(hr-12) : hr;
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
    // Setup input handlers
	intervalCtrl = document.querySelector("#intervalCtrl");
	startingTimeCtrl = document.querySelector("#startingTimeCtrl");
	volumeCtrl = document.querySelector("#volumeCtrl");
	blockCtrl = document.querySelector("#blockCtrl");
	modeCtrl = document.querySelector("#modeCtrl");

	rowTemplate = document.querySelector("#rowTemplate")

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
	
	modeCtrl.addEventListener("input", (e) => {
		mode = modes[e.target.value];
		
        // Toggle settings that are exclusive to a particular option
		if (mode == modes["INTERVIEW"]) {
			document.querySelector("#blockCtrl").parentNode.parentNode.style.display = "none";
			document.querySelector("#intervalCtrl").parentNode.parentNode.parentNode.style.display = "inline-block";
		} else {
			document.querySelector("#blockCtrl").parentNode.parentNode.style.display = "inline-block";
			document.querySelector("#intervalCtrl").parentNode.parentNode.parentNode.style.display = "none";
		}
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

    // Populate exam block times with defaults
    examBlocks = [{ text: "Perusal", duration: 10 }, { text: "Main", duration: 60 }, { text: "Finish", duration: 5 }];

    createExamBlockRows();
	updateTotalExamTime();
}

/**
 * Creates "exam rows" as per the data stored in the 'examBlocks' variable.
 */
function createExamBlockRows() {

	examBlocks.forEach((eb) => {

		var content = document.importNode(rowTemplate.content, true);

		// TODO: hide "minus" button from first row
		var inputs = content.querySelectorAll("input");

		inputs[0].value = eb.text;
		inputs[1].value = eb.duration;

		document.querySelector("#blockCtrl").appendChild(content);
	});
}

/**
 * Updates the examBlocks variable to contain updated information.
 * This function should be called whenever a change is made to an exam row's description/length.
 */
function updateExamBlockData() {
	// Reset examBlocks
	examBlocks = [];

	var tableRows = document.querySelectorAll("table .examRow");

	// Update examBlocks accordingly
	tableRows.forEach((tr) => {
		var inputs = tr.querySelectorAll("input");
		examBlocks.push({ text: inputs[0].value, duration: inputs[1].value });
	});
}

/**
* Updates the "total duration" text on the exam timer block config as expected.
**/
function updateTotalExamTime() {
	var tableInputs = document.querySelectorAll(".timeInput");
	
	var sum = 0;
	
	tableInputs.forEach((ti) => {
		sum += Number(ti.value);
	});
	
	var mins = sum%60;
	var hrs = (sum-mins)/60;

	// Format mins/hrs 
	var fMins = (mins > 1) ? `${mins} mins` : `${mins} min`;
	if (hrs !== 0) {
		var fHrs = (hrs > 1) ? `${hrs} hrs` : `${hrs} hr`;
	}

	var formattedTime;
	
	// Add "s" if longer than one hour
	if (hrs != 0) {
		formattedTime = fHrs;
	}
	
	if (mins !== 0) {
		if (formattedTime != "") {
			formattedTime += ", "
		}
		formattedTime += fMins;
	}
	
	document.querySelector("#totalDuration").innerHTML = formattedTime;
}

/**
 * Removes a passed row and updates the total exam duration
 * @param {*} row 
 */
function removeCurRow(row) {
    row.parentNode.remove();
	updateTotalExamTime();
}

/**
 * Adds a *single* new row BELOW a row passed as a parameter.
 * As of ES6, JavaScript does not support an addAfter method -- why?
 * @param {*} row
 */
function addNewRow(row) {
    var nextRow = row.parentElement.nextElementSibling;

    var content = document.importNode(rowTemplate.content, true);
	content.addEventListener("input", () => updateExamBlockData());

    row.parentNode.parentNode.insert(content, nextRow);
}

/**
* Imports a custom (valid) configuration file and applies the settings as specified.
**/
function importConfig(fileInput) {
	var fileExt = fileInput.value.split(".").pop();
	
	if (fileExt.toLowerCase() != "timer") {
		return alert("Unrecognised input. Please upload a valid .timer file.");
	}
	
	file = fileInput.files[0];
	
	const reader = new FileReader();
	reader.readAsText(file);
	
	reader.onload = () => {
		var config = JSON.parse(reader.result);
		
		// Set mode settings
		mode = config.mode;
		var options = modeCtrl.querySelectorAll("option");
		options[0].selected = (mode == modes.INTERVIEW) ? true : false;
		options[1].selected = (mode == modes.EXAM) ? true : false;

		// Set bell volume settings
		bell.volume = config.volume;
		volumeCtrl.value = bell.volume;
		setBubblePos(volumeCtrl, volumeCtrl.parentNode.querySelector(".bubble"));
		
		// Set interview interval settings
		interval = config.interval;
		intervalCtrl.value = interval;
		setBubblePos(intervalCtrl, intervalCtrl.parentNode.querySelector(".bubble"));
		
		// Set starting time settings
		startingTime = config.startingTime;
		startingTimeCtrl.value = startingTime;
		
		// Hide/show certain controls depending on the mode specified in the config file
		intervalCtrl.parentNode.parentNode.style.display = (config.mode == modes.INTERVIEW ? "inline-block" : "none");
		blockCtrl.parentNode.parentNode.style.display = (config.mode == modes.EXAM ? "inline-block" : "none");

		if (mode == modes.EXAM) {
			examBlocks = config.examBlocks;

			// Delete all existing exam rows
			var trs = document.querySelectorAll(".examRow");
			trs.forEach(tr => tr.remove());

			// Construct new exam rows from data specified in the config file
			createExamBlockRows();
			updateTotalExamTime();
		}

		// Enable the START button
		document.querySelector("#startButton").disabled = false;
	}

	reader.onerror = () => {
		// TODO: more insightful error messages
		alert("Error - please retry")
	}
}

/**
 * Adjusts the position of a range bubble to be above its respective range element.
 * @param {*} range 
 * @param {*} bubble 
 */
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
    var newVal = ((range.value - range.min) * 100) / (range.max - range.min);
    bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
}

/**
* Exports the current configuration settings into a file that can be reused/imported.
*/
function exportConfig() {
	var config = {
		mode,
		interval,
		startingTime,
		examBlocks,
		volume: bell.volume
	}
	
	var filename = prompt("Please specify a filename:");
	
	if (!filename) return;
	
	// Create a link that when clicked, will initiate the download of the config file
	var element = document.createElement("a");
	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(config)));
	element.setAttribute("download", filename ? `${filename}.timer` : "config.timer");
	
	// Hide it and add to body, so that it can be clicked
	element.style.display = "none";
	document.body.appendChild(element);
	
	element.click();
	
	document.body.removeChild(element);
}