var interval = 10;
var sessStart, sessEnd;
var startingTime;
var mode;
var bell = new Audio()
var examBlocks = [];

var cdMins, cdSecs;
var cdTitle, cdDescription;

// Timer mode enums
const modes = {"INTERVIEW": 1, "EXAM": 2, "COUNTDOWN": 3};
Object.freeze(modes);

// set default mode
mode = modes.INTERVIEW;

const bellSounds = {"START": "bell-start.ogg", "END": "bell-end.ogg"}
Object.freeze(bellSounds);

// Input control references
var intervalCtrl, startingTimeCtrl, volumeCtrl, blockCtrl, modeCtrl, cdMinsCtrl, cdSecsCtrl, cdTitleCtrl, cdDescriptionCtrl;

var bubbleInputs = [intervalCtrl, volumeCtrl];

var ctrlsByInput = new Map();

// Interview only - used to keep count of the current session number 
var i = 0;

// Templates
var rowTemplate;

var inputGroups = new Map();

var inputsInMemory = [];


/**
 * The core logic loop of the program.
 */
function start() {

	// Show close button
	show(document.querySelector("#closeButton"));

    // Hide scrollbar
    document.getElementsByTagName("html")[0].style.overflow = "hidden";
	
	// Hide mouse cursor
	// document.getElementsByTagName("html")[0].style.cursor = "none";

    // Make page fullscreen
    document.documentElement.requestFullscreen();
	
	// Hide config screen
	hide(document.querySelector("#configContainer"));
	

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
		
		// Set countdown mins/secs to 0 if no value is supplied by user
		cdMins = (cdMinsCtrl.value == "") ? 0 : cdMins;
		cdSecs = (cdSecsCtrl.value == "") ? 0 : cdSecs;
	
		return startCountdown();
	}

	// This is done for calculating msToStart
	var startingTimeHour = startingTime.split(":")[0];
	var startingTimeMin = startingTime.split(":")[1];

    // Time formatting and padding bullshit
    setStartingTimeText();
	
	// Get num of seconds until the countdown starts (i.e. num ms to specified "starting time")
    var date = new Date();
    var msToStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startingTimeHour, startingTimeMin, 0, 0) - Date.now();

	// The core logic  that is initiated at the starting time
    setTimeout(() => {

		// TODO: This probably shouldn't be playing when the exam starts
        playBell();
		
		if (mode == modes.INTERVIEW) {
			sessEnd = addMins(startingTime, interval);
			newInterviewSession(interval);

			// Get rid of the starting at "hh:mm" text
			hide(document.querySelector("#startingTime"));
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

	// Update clock display every tenth of a second, as to remain relatively synchronised with system clock
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

/**
 * Disables fullscreen and refreshes the page, because reverting to default values is too hard.
 */
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
	uiElements.forEach((ui) => hide(ui));
	show(document.querySelector("#finishText"));

	// Untoggle fullscreen
	playBell(bellSounds.END);
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
		cdd.textContent = cdDescription;
	}

	// This is
	while (msToGo > 0) {
		
		// Calculate and subsequently format mins/secs remaining in countdown
		min = String(Math.floor((msToGo/1000/60) << 0));
		sec = String(Math.floor((msToGo/1000) % 60));
		
		// Update shit here
		cdText.textContent = `${min.padStart(2, 0)}:${sec.padStart(2, 0)}`

		await sleep(1000);

		msToGo -= 1000;
	}

	// Countdown finished
	cdText.textContent = `00:00`;
	playBell(bellSounds.END);
}

/**
 * Adds a specified number of minutes to the starting time and then returns the result ().
 * @param {*} numMins The number of minutes to be added to the starting time.
 * @returns a string of the formatted time
 */
function addMins(time, numMins) {
    var hrs = Number(time.substr(0, 2));
    var mins = Number(time.substr(3, 2));

    mins += Number(numMins);

	// Reduce mins to under 60, and account for the extra hours this reduction results in
    while (mins >= 60) {
        hrs = Number(hrs) + 1;
        mins -= 60;
    }

    if (mins == 60) {
        mins = 0;
    }

    return `${convertTo12hrs(hrs).padStart(2,0)}:${`${mins}`.padStart(2,0)}`;
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

function playBell(sound=bellSounds.START) {
	var bellSound;
	
	switch (sound) {
		case bellSounds.START:
			bellSound = "bell-start.ogg";
			break;
		case bellSounds.END:
			bellSound = "bell-end.ogg";
			break;
		default:
			bellSound = "bell-start.ogg";
			break;
	}
	
	bell.src = `./media/${bellSound}`;
    bell.play();
}

// Run once the page has loaded
window.onload = async () => {
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

	rowTemplate = document.querySelector("#rowTemplate");

    intervalCtrl.addEventListener("input", (e) => {
        interval = e.target.value;
		localStorage.interval = interval;
    });

    startingTimeCtrl.addEventListener("input", (e) => {
        startingTime = e.target.value;
		localStorage.startingTime = startingTime;
        document.querySelector("#startButton").disabled = false;

        // TODO - prevent user from selecting an invalid time (e.g. "before now")
    });

    volumeCtrl.addEventListener("input", (e) => {
        bell.volume = e.target.value;
		localStorage.volume = bell.volume;
    });
	
	modeCtrl.addEventListener("input", (e) => {
		localStorage.mode = e.target.value;
		
		mode = modes[e.target.value];
		
        // Toggle settings that are exclusive to a particular option
		showInputsBasedOnMode(mode);
	});

	cdMinsCtrl.addEventListener("input", (e) => {
		cdMins = e.target.value;
		localStorage.cdMins = cdMins;

		cdEnableStartButton();
	});
	
	cdSecsCtrl.addEventListener("input", (e) => {
		let val = e.target.value;

		val = (e.target.value > 59) ?  59 : e.target.value;

		cdSecsCtrl.value = val;
		cdSecs = val;

		localStorage.cdSecs = cdSecs;

		cdEnableStartButton();
	});

	cdTitleCtrl.addEventListener("input", (e) => {
		cdTitle = e.target.value;
		localStorage.cdTitle = cdTitle;
	});

	cdDescriptionCtrl.addEventListener("input", (e) => {
		cdDescription = e.target.value;
		localStorage.cdDescription = cdDescription;
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
    defaultExamBlocks = [{ text: "Perusal", duration: 10 }, { text: "Main", duration: 60 }, { text: "Finish", duration: 5 }];
	examBlocks = defaultExamBlocks;
    // examBlocks = [{ text: "Perusal", duration: 1 }, { text: "Main", duration: 1 }];
    // examBlocks = [{ text: "Perusal", duration: 0.02 }];

	ctrlsByInput["interval"] = intervalCtrl;
	ctrlsByInput["startingTime"] = startingTimeCtrl;
	ctrlsByInput["volume"] = volumeCtrl;
	ctrlsByInput["examBlocks"] = blockCtrl;
	ctrlsByInput["mode"] = modeCtrl;
	ctrlsByInput["cdMins"] = cdMinsCtrl;
	ctrlsByInput["cdSecs"] = cdSecsCtrl;
	ctrlsByInput["cdTitle"] = cdTitleCtrl;
	ctrlsByInput["cdDescription"] = cdDescriptionCtrl;

	inputGroups[1] = [intervalCtrl, startingTimeCtrl];								// Interview inputs
	inputGroups[2] = [blockCtrl, startingTimeCtrl];									// Exam inputs
	inputGroups[3] = [cdMinsCtrl, cdSecsCtrl, cdTitleCtrl, cdDescriptionCtrl];		// Countdown inputs

	bubbleInputs = [intervalCtrl, volumeCtrl];

	// showInputsBasedOnConfig(mode);

	// TODO: probably doesn't need to be asynchronous
	loadLocalStorage();

	// Only create default exam blocks if not already present
	if (examBlocks === defaultExamBlocks) {
		createExamBlockRows();
	}

	updateTotalExamTime();
}

/**
 * Displays config form inputs based on the current mode.
 * @param {*} m timer mode - as either an integer or an enum (INTERVIEW by defualt).
 */
function showInputsBasedOnMode(m=1) {
	// Convert enum string to respective integer
	if (typeof m === 'string') {
		m = modes[m];
	}

	// Remove the elements that were visible for the previously selected mode
	inputsInMemory.forEach((input) => {
		hide(parentRowFromCtrl(input));
	});

	// Get a list of nodes to be shown
	var shownNodes = inputGroups[m];
	
	// Reset
	inputsInMemory = [];

	// Show relevant inputs and add them to memory (to be removed next mode selection)
	shownNodes.forEach((input) => {
		show(parentRowFromCtrl(input));
		inputsInMemory.push(input);
	});
}

/**
 * Returns the overarching "parent" row for a provided input control element
 * @param {*} ctrl an input element with a "name" attribute
 * @returns 
 */
function parentRowFromCtrl(ctrl) {

	var el = document.querySelector(`label[for="${ctrl.attributes.name.value}"]`);

	while (!el.classList.contains("row")) {
		el = el.parentNode;
	}

	return el;
}

function show(el) {
	el.style.display = "inline-block";
}

function hide(el) {
	el.style.display = "none";
}

/**
 * Loads settings from local storage (if available)
 */
function loadLocalStorage() {
	for (const [key, input] of Object.entries(ctrlsByInput)) {
		if (localStorage[key]) {
			input.value = localStorage[key];
			window[key] = localStorage[key];
		}

		// Here be edge cases
		if (key == "mode") {
			// Readjust config UI to only display what is required for the current mode
			mode = modes[localStorage[key]];
			showInputsBasedOnMode(localStorage[key]);
		}

		if (key == "examBlocks") {
			if (localStorage[key]) {
				examBlocks = JSON.parse(localStorage.examBlocks);
				createExamBlockRows();
			}
		}

		// Update bubble positions for inputs that use them
		if (bubbleInputs.includes(input)) {
			setBubblePos(input.parentNode.querySelector(".range"), input.parentNode.querySelector(".bubble"))
		}
	}
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

	localStorage.examBlocks = JSON.stringify(examBlocks);
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
    bubble.style.left = `calc(${newVal}% + (${0-newVal * 0.15}px))`;
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