var interval = 10;
var sessStart, sessEnd;
var startingTime;
var mode;
var bell = new Audio("./media/bell.mp3");
var examBlocks = [];

var cdMins, cdSecs;
var cdTitle, cdDescription;

// Timer mode enums
const modes = {"INTERVIEW": 1, "EXAM": 2, "COUNTDOWN": 3};
Object.freeze(modes);

// set default mode
mode = modes.INTERVIEW;

// Input control references
var intervalCtrl, startingTimeCtrl, volumeCtrl, blockCtrl, modeCtrl, cdMinsCtrl, cdSecsCtrl, cdTitleCtrl, cdDescriptionCtrl;

// Interview only - used to keep count of the current session number 
var i = 0;

// Templates
var rowTemplate;


/**
 * The core logic loop of the program.
 */
function start() {

	// Show close button
	document.querySelector("#closeButton").style.display = "inline-block"

    // Hide scrollbar
    document.getElementsByTagName("html")[0].style.overflow = "hidden";
	
	// Hide mouse cursor
	// document.getElementsByTagName("html")[0].style.cursor = "none";

    // Make page fullscreen
    document.documentElement.requestFullscreen();
	
	// Hide config screen
	document.querySelector("#configContainer").style.display = "none";
	

	// Show appropriate timer screen
	if (mode == modes.INTERVIEW) {
		document.querySelector("#interviewTimerContainer").removeAttribute("hidden");
	}
	else if (mode == modes.EXAM) {
		document.querySelector("#examTimerContainer").removeAttribute("hidden");
		setExamBlocksText(examBlocks);
	}
	else if (mode == modes.COUNTDOWN) {
		document.querySelector("#countdownContainer").removeAttribute("hidden");
		
		if (cdMinsCtrl.value == "") {
			cdMins = 0;
		}
		
		if (cdSecsCtrl.value == "") {
			cdSecs = 0;
		}
	
		return startCountdown();
	}

	var startingTimeHour = startingTime.split(":")[0];
	var startingTimeMin = startingTime.split(":")[1];

    // Time formatting and padding bullshit
    setStartingTimeText();
	
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
			document.querySelector("#currentSession").removeAttribute("hidden");
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

		var fHrs = convertTo12hrs(now.getHours()).padStart(2,0);
		var fMins = String(now.getMinutes()).padStart(2,0);
		var fSecs = String(now.getSeconds()).padStart(2,0);

		clocks.forEach(c => c.textContent = `${fHrs}:${fMins}:${fSecs}`)
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

function closePage() {
	// Disable fullscreen
	if (!document.fullscreenElement &&    // alternative standard method
		!document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
	  if (document.documentElement.requestFullscreen) {
		document.documentElement.requestFullscreen();
	  } else if (document.documentElement.msRequestFullscreen) {
		document.documentElement.msRequestFullscreen();
	  } else if (document.documentElement.mozRequestFullScreen) {
		document.documentElement.mozRequestFullScreen();
	  } else if (document.documentElement.webkitRequestFullscreen) {
		document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
	  }
	} else {
	  if (document.exitFullscreen) {
		document.exitFullscreen();
	  } else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	  } else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	  } else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	  }
	}

	// Refresh page
	location.reload();
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
		// alert("Done")
	}
	
	// Recursively run all of the required timer blocks.
	setTimeout(() => {

		// playBell();
		
		// Stikeout the last block when it has finished playing, and revert back to normal text
		document.querySelector(`.block:nth-child(${index})`).style.textDecoration = "line-through";
		document.querySelector(`.block:nth-child(${index})`).classList.remove("block-active");

		// Add active to block
		try {
			document.querySelector(`.block:nth-child(${index + 1})`).classList.add("block-active");
		} catch(e) {
			return examFinished();
		}
		// **the recursive call**
		newExamSession(index + 1);

	}, examBlocks[index - 1].duration * 1000 * 60);
}

function examFinished() {
	var uiElements = document.querySelectorAll("#blocks, .currentTime");
	uiElements.forEach((ui) => ui.style.display = "none");
	document.querySelector("#finishText").style.display = "inline-block";

	// Untoggle fullscreen
	playBell();
}

async function startCountdown() {
	var msToGo = (cdMins*1000*60) + (cdSecs*1000);
	var min, sec;
	var cdText = document.querySelector("#countdownTime");

	if (cdTitle) {
		var cdt = document.querySelector("#cdTitle");

		cdt.parentNode.style.visibility = "inline-block";
		cdt.textContent = cdTitle;
	}

	if (cdDescription) {
		var cdd = document.querySelector("#cdDescription");

		cdd.parentNode.style.visibility= "inline-block";
		cdd.textContent = cdDescription
	}

	while (msToGo > 0) {
		
		min = String(Math.floor((msToGo/1000/60) << 0));
		sec = String(Math.floor((msToGo/1000) % 60));
		
		// Update shit here
		cdText.textContent = `${min.padStart(2, 0)}:${sec.padStart(2, 0)}`

		await sleep(1000);

		msToGo -= 1000;
	}

	cdText.textContent = `00:00`;

	playBell();
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

    return `${convertTo12hrs(stHrs).padStart(2,0)}:${`${stMins}`.padStart(2,0)}`;
}

/**
 * Reformats an hour value to not exceed 12 - e.g. 14 --> 2
 * @param {*} hr Hour value (ranging from 00 - 23)
 * @returns 
 */
function convertTo12hrs(hr) {
	return (hr > 12) ? `${hr-12}` : `${hr}`;
}

function setStartingTimeText() {
    if (Number(startingTime.substr(0, 2)) > 12) {
        var temp = String(Number(startingTime.substr(0, 2) - 12));
        temp = temp.padStart(2,0);

        // TODO: Needs AM, too
        // startingTime = `${temp}:${startingTime.substr(3, 5)} PM`;
        startingTime = `${temp}:${startingTime.substr(3, 5)}`;

        if ((startingTime.substr(0, 2)).includes(":")) {
            startingTime = startingTime.padStart(2,0);
        }
    } else if (startingTime.substr(0, 2) == 12) {
        // startingTime += " PM";
    } else {
        // startingTime += " AM";
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
	cdMinsCtrl  = document.querySelector("#cdMinsCtrl");
	cdSecsCtrl = document.querySelector("#cdSecsCtrl");
	cdTitleCtrl = document.querySelector("#cdTitleCtrl");
	cdDescriptionCtrl = document.querySelector("#cdDescriptionCtrl");

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
		// TODO: this shit is way too inefficient
		if (mode == modes["INTERVIEW"]) {
			blockCtrl.parentNode.parentNode.style.display = "none";
			intervalCtrl.parentNode.parentNode.parentNode.style.display = "inline-block";
			startingTimeCtrl.parentNode.parentNode.style.display = "inline-block";
			document.querySelector("#countdownRow").style.display = "none";
			cdTitleCtrl.parentNode.parentNode.style.display = "none";
			cdDescriptionCtrl.parentNode.parentNode.style.display = "none";
		}
		else if (mode == modes["EXAM"]) {
			blockCtrl.parentNode.parentNode.style.display = "inline-block";
			intervalCtrl.parentNode.parentNode.parentNode.style.display = "none";
			startingTimeCtrl.parentNode.parentNode.style.display = "inline-block";
			document.querySelector("#countdownRow").style.display = "none";
			cdTitleCtrl.parentNode.parentNode.style.display = "none";
			cdDescriptionCtrl.parentNode.parentNode.style.display = "none";
		}
		else if (mode == modes["COUNTDOWN"]) {
			blockCtrl.parentNode.parentNode.style.display = "none";
			intervalCtrl.parentNode.parentNode.parentNode.style.display = "none";
			startingTimeCtrl.parentNode.parentNode.style.display = "none";
			document.querySelector("#countdownRow").style.display = "inline-block";
			cdTitleCtrl.parentNode.parentNode.style.display = "inline-block";
			cdDescriptionCtrl.parentNode.parentNode.style.display = "inline-block";
		}
	});

	cdMinsCtrl.addEventListener("input", (e) => {
		cdMins = e.target.value;

		cdEnableStartButton();
	});
	
	cdSecsCtrl.addEventListener("input", (e) => {
		let val = e.target.value;

		val = (e.target.value > 59) ?  59 : e.target.value;

		cdSecsCtrl.value = val;
		cdSecs = val;

		cdEnableStartButton();
	});

	cdTitleCtrl.addEventListener("input", (e) => {
		cdTitle = e.target.value;
	});

	cdDescriptionCtrl.addEventListener("input", (e) => {
		cdDescription = e.target.value;
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
    // examBlocks = [{ text: "Perusal", duration: 1 }, { text: "Main", duration: 1 }];
    // examBlocks = [{ text: "Perusal", duration: 0.02 }];


    createExamBlockRows();
	updateTotalExamTime();
}

/**
 * Countdown mode - enable the start button if both inputs are filled in, otherwise disable it.
 */
function cdEnableStartButton() {
	
	if (cdMinsCtrl.value == "" && cdSecsCtrl.value == "") {
		document.querySelector("#startButton").disabled = true;
	} else {
		document.querySelector("#startButton").disabled = false;
	}
}

/**
 * Creates "exam rows" as per the data stored in the 'examBlocks' variable.
 */
function createExamBlockRows() {

	examBlocks.forEach((eb, index) => {

		var content = document.importNode(rowTemplate.content, true);

		// Hide "minus" button from first row
		if (index == 0) {
			content.querySelector(".removeCurRow").style.visibility = "hidden";
		}
		
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

	var formattedTime = "";
	
	// Add "s" if longer than one hour
	if (hrs !== 0) {
		formattedTime = fHrs = (hrs > 1) ? `${hrs} hrs` : `${hrs} hr`;
	}
	
	// Add mins if not a full hour AND longer than a single hour
	if (mins !== 0) {
		if (formattedTime != "") {
			formattedTime += ", "
		}
		formattedTime += fMins;
	}
	
	document.querySelector("#totalDuration").innerHTML = `Total duration: ${formattedTime}`;
}

/**
 * Removes a passed row and updates the total exam duration
 * @param {*} row 
 */
 async function removeCurRow(row) {
	row.parentNode.style.animation = "popOut 0.2s 1";
	await sleep(120);
	row.parentNode.style.transform = "display: scale(0)";
    row.parentNode.remove();
	updateTotalExamTime();
	updateExamBlockData();
}

/**
* "Sleep" for a specified amount of time
* @param {*} sleep milliseconds
*/
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
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
    row.parentNode.parentNode.insertBefore(content, nextRow);

	updateTotalExamTime();
	updateExamBlockData();
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
		options[2].selected = (mode == modes.COUNTDOWN) ? true : false;

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
		intervalCtrl.parentNode.parentNode.parentNode.style.display = (config.mode == modes.INTERVIEW ? "inline-block" : "none");
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
		
		if (mode == modes.COUNTDOWN) {
			startingTimeCtrl.parentNode.parentNode.style.display = "none";
			document.querySelector("#countdownRow").style.display = "inline-block";

			cdTitleCtrl.parentNode.parentNode.style.display = "inline-block";
			cdDescriptionCtrl.parentNode.parentNode.style.display = "inline-block";
			
			cdMins = config.cdMins;
			cdMinsCtrl.value = cdMins;
			
			cdSecs = config.cdSecs;
			cdSecsCtrl.value = cdSecs;

			cdTitle = config.cdTitle;
			cdTitleCtrl.value = cdTitle;

			cdDescription = config.cdDescription;
			cdDescriptionCtrl.value = cdDescription;
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
		volume: bell.volume,
		cdMins,
		cdSecs,
		cdTitle,
		cdDescription
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