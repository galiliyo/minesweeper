"use strict";
/*
Display Logic

Cell State                Condition                     Graphic Element
------------------------------------------------------------------------		
is Not Shown (hidden)	    If not flagged	   	          Blank Cover	
is Not Shown (hidden)	    If Flagged	                  Flag	
isShown	                  If number > 0		              Number
isShown	                  Floor	if number = 0	          Blank 


GAME OVER	
------------------------------------------------------------------------	
is Not Shown (hidden)	   if marked and a mine	          Flag	           	
is Not Shown (hidden)	   if marked and not mine         x Mine           			
is Not Shown (hidden)	   if not marked & not mine       Blank Cover	      		
is Not Shown (hidden)    if mine		                    Mine	            
isShown	                 if number > 0	                Number            	
isShown	                 if number === 0	              Blank Floor      		
is Not Shown (hidden)    if clicked mine	              Red Mine	        	

*/

const MINE_IMG = '<img src="img/mine.png" style="width: 36px;">';
const FLAG_IMG = '<img src="img/flag.png" style="width: 36px;">';
const COVER_IMG = '<img src="img/cover.png" style="width: 36px;">';
const MINE_FALSE_IMG = '<img src="img/mine_false.png" style="width: 36px;">';
const MINE_EXPLODE = '<img src="img/mine-explode.png" style="width: 36px;">';
var gBoard;
var gTimerID;

var gLevel = {
  LEVEL: 2,
  SIZE: 8,
  MINES: 12
};

var gGame = {
  isOn: false,
  wasWon: null,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
  player: "Default Name"
};

function init() {
  initGameVars();
  gBoard = buildBoard();
  renderBoard(gBoard);
  checkLastPlayer();
  updateStatDisplay();
}

function initGameVars() {
  gGame.isOn = false;
  gGame.wasWon = null;
  gGame.shownCount = 0;
  gGame.markedCount = 0;
  gGame.secsPassed = 0;
  return;
}

function buildBoard() {
  var board = [];
  const ROWS = gLevel.SIZE;
  const COLS = gLevel.SIZE;

  for (var i = 0; i < ROWS; i++) {
    board[i] = [];
    for (var j = 0; j < COLS; j++) {
      var cell = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false
      };
      board[i][j] = cell;
    }
  }

  return board;
}

// populate mines
function populateMines(board, location) {
  for (var ii = 1; ii <= gLevel.MINES; ii++) {
    var j = -1;
    var i = -1;
    while (
      i === -1 ||
      board[i][j].isMine ||
      (i === +location.i && j === +location.j)
    ) {
      i = getRandomInt(0, gLevel.SIZE - 1);
      j = getRandomInt(0, gLevel.SIZE - 1);
    }
    board[i][j].isMine = true;
  }
  gBoard = setMinesAround(gBoard);
  utilPrintToConsole();
  renderBoard(gBoard);
  return board;
}

// Render the board to an HTML table
function renderBoard(board) {
  var strHTML = "";
  for (var i = 0; i < gLevel.SIZE; i++) {
    strHTML += "<tr>\n";
    for (var j = 0; j < gLevel.SIZE; j++) {
      var currCell = board[i][j];
      var cellLocationData = getLocationData({
        i: i,
        j: j
      });
      // TODO add color class to number

      strHTML += `\t<td class="cell " data-location="${cellLocationData}" onclick="cellClicked(event, this)" oncontextmenu="cellMarked(event, this)">\n`;

      var isShown = currCell.isShown;
      var isMarked = currCell.isMarked;
      var isMine = currCell.isMine;
      var minesAroundCount = currCell.minesAroundCount;

      if (gGame.isOn) {
        if (isShown && minesAroundCount > 0) strHTML += minesAroundCount;
        else if (!isShown && isMarked) strHTML += FLAG_IMG;
        else if (!isShown && !isMarked) strHTML += COVER_IMG;
      }

      if (!gGame.isOn) {
        if (!isShown && isMine && isMarked) strHTML += FLAG_IMG;
        else if (!isShown && isMine && !isMarked) strHTML += MINE_IMG;
        else if (!isShown && !isMine && isMarked) strHTML += MINE_FALSE_IMG;
        else if (!isShown && !isMine && !isMarked) strHTML += COVER_IMG;
        else if (isShown && minesAroundCount > 0) strHTML += minesAroundCount;
      }
      strHTML += "\t</td>\n";
    }
    strHTML += "</tr>\n";
  }
  var elBoard = document.querySelector(".board");
  elBoard.innerHTML = strHTML;
}

// TODO Render Cell

// function renderCell(position, element) {
//   var i = position[0]
//   var j = position[1]
//   var currCell = board[i][j]
//   var cellLocationData = getLocationData({
//     i: i,
//     j: j
//   })
// }

function updateStatDisplay() {
  var timerLabel = document.querySelector(".timer-digits");
  var el = document.querySelector(".stats .mines_marked");

  timerLabel.innerText = gGame.secsPassed;
  el.innerText = gLevel.MINES - gGame.markedCount;
}

// Handle cell Click - detect first click to populate mines

function cellClicked(event, elCell) {
  if (!gGame.isOn && !gGame.wasWon === null) return;

  var location = getLocationFromElement(elCell);
  var i = location.i;
  var j = location.j;

  // detect first click, initialize game on and populate mines
  if (gGame.wasWon === null) {
    gGame.isOn = true;
    gGame.wasWon = false;
    gBoard = populateMines(gBoard, location);
    timerOn();
  }

  if (gBoard[i][j].isMarked) {
    return;
  } else if (gBoard[i][j].isMine) {
    mineExplodes(location);
  } else {
    expandShown(location);
  }
  checkGameOver(gBoard);
}

// Handle Right Click
function cellMarked(event, elCell) {
  event.preventDefault();
  if (!gGame.isOn) return;

  var location = getLocationFromElement(elCell);
  var i = location.i;
  var j = location.j;

  if (gBoard[i][j].isShown) {
    return;
  } else {
    if (gBoard[i][j].isMarked) {
      gBoard[i][j].isMarked = false;
      gGame.markedCount--;
    } else {
      gBoard[i][j].isMarked = true;
      gGame.markedCount++;
    }
  }
  renderBoard(gBoard);
  updateStatDisplay();
  checkGameOver(gBoard);
  return;
}

/// expand recursive
function expandShown(location) {
  var i = +location.i;
  var j = +location.j;
  var board = gBoard;

  expandRec(board, i, j);

  function expandRec(board, i, j) {
    if (i < -0 || i > gLevel.SIZE - 1 || j < -0 || j > gLevel.SIZE - 1) return;

    var cell = board[i][j];
    if (cell.isMine || cell.isMarked || cell.isShown) {
      return;
    } else if (cell.minesAroundCount > 0) {
      cell.isShown = true;
      gGame.shownCount++;
      return;
    } else if (cell.minesAroundCount === 0) {
      cell.isShown = true;
      gGame.shownCount++;
      expandRec(board, i - 1, j - 1);
      expandRec(board, i - 1, j);
      expandRec(board, i + 1, j + 1);
      expandRec(board, i, j + 1);
      expandRec(board, i + 1, j + 1);
      expandRec(board, i + 1, j);
      expandRec(board, i - 1, j - 1);
      expandRec(board, i, j - 1);
    }
  }
  renderBoard(gBoard);
}

function setMinesAround(board) {
  const ROWS = gLevel.SIZE;
  const COLS = gLevel.SIZE;

  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      var count = countMinesAround(i, j);
      board[i][j].minesAroundCount = count;
    }
  }
  return board;
}

function countMinesAround(i, j) {
  var mineNegCount = 0;
  for (var ii = i - 1; ii <= i + 1; ii++) {
    for (var jj = j - 1; jj <= j + 1; jj++) {
      if (i === ii && j === jj) {
        continue;
      }
      if (
        ii < 0 ||
        ii > gBoard.length - 1 ||
        jj < 0 ||
        jj > gBoard.length - 1
      ) {
        continue;
      }
      if (gBoard[ii][jj].isMine) {
        mineNegCount++;
      }
    }
  }
  return mineNegCount;
}

function checkGameOver(board) {
  var totalCells = gLevel.SIZE * gLevel.SIZE;
  if (
    totalCells - gGame.shownCount === gLevel.MINES &&
    gGame.markedCount == gLevel.MINES
  ) {
    handleGameWon();
    return true;
  } else {
    return false;
  }
}

function handleGameWon() {
  gGame.isOn = false;
  clearInterval(gTimerID);

  /// handle game winning greeting

  var WinningGreetings = [
    "Congrats, You Won!",
    "You Are Awesome!",
    "Nice Job!",
    "Cool, let’s see you try again",
    "You are da shizet!",
    "Wunderbar mein schatz!"
  ];
  var greeting = document.querySelector(".greeting-display");
  greeting.innerText =
    "✔ " + WinningGreetings[getRandomInt(0, WinningGreetings.length)];
  greeting.style.color = "rgb(98, 187, 231)";
  greeting.style.opacity = "1";

  // handle records keeping and display leaderboard
  var records = updateRecordes(gLevel.LEVEL, gGame.player, gGame.secsPassed);
  renderLeaderBoard(records);
  document.querySelector(".leaderboard").style.opacity = 1;
}

function renderLeaderBoard(records) {
  document.querySelector(".control-panel").style.height = "480px;";
  document.querySelector(".leaderboard-title-level").innerText = gLevel.LEVEL;
  var leaderboardList = document.querySelector("ol");
  leaderboardList.innerHTML = "";
  var levelRecords = records[`level_${gLevel.LEVEL.toString()}`];

  var leaderboardList = document.querySelector("ol");

  var leaderboardLength = levelRecords.length;
  var delay = 120;

  for (let ii = 0; ii < leaderboardLength; ii++) {
    setTimeout(renderLI, delay * ii, ii);
  }

  function renderLI(idx) {
    var recordBorken = isNewRecord(
      gLevel.LEVEL,
      gGame.secsPassed,
      gGame.player
    );
    var record = levelRecords[idx];
    var newRecordTxt = "";

    if (
      recordBorken &&
      levelRecords[idx].time === gGame.secsPassed &&
      levelRecords[idx].name === gGame.player
    ) {
      newRecordTxt += '<span class = "new-record"> - A New Record!</span>';
    }
    var recordHTML = `<li><span class="ld-name">${record.name}  -  ${record.time} sec. ${newRecordTxt}</span></li>`;

    leaderboardList.insertAdjacentHTML("beforeend", recordHTML);
  }
}

function resetGame(selectedLevel) {
  document.querySelector(".greeting-display").style.opacity = 0;
  document.querySelector(".leaderboard").style.opacity = 0;
  var mines;
  var size;
  clearInterval(gTimerID);
  switch (selectedLevel) {
    case 1:
      size = 4;
      mines = 2;
      break;
    case 2:
      size = 8;
      mines = 12;
      break;
    case 3:
      size = 12;
      mines = 30;
      break;
    default:
      size = gLevel.SIZE;
      mines = gLevel.MINES;
      selectedLevel = gLevel.LEVEL;
      break;
  }
  gLevel.LEVEL = selectedLevel;
  gLevel.SIZE = size;
  gLevel.MINES = mines;

  initGameVars();
  updateStatDisplay();
  init();
}

function mineExplodes(location) {
  gGame.isOn = false;
  gGame.wasWon = false;
  clearInterval(gTimerID);
  renderBoard(gBoard);
  var cellLocationData = getLocationData(location);
  var elCell = document.querySelector(`[data-location="${cellLocationData}"]`);
  elCell.innerHTML =
    `\t<td class="cell " data-location="${cellLocationData}" onclick="cellClicked(event, this)" oncontextmenu="cellMarked(event, this)">\n` +
    MINE_EXPLODE;
  // Handel loosing greeting
  var loosingGreetings = [
    "Maybe you should try solitaire instead",
    "You lost, what a shame",
    "You should try harder next time",
    "Come on, you are better than that!",
    "I hope nobody saw that…",
    "Really?! That’s all you can do?",
    "Try again...Practice makes perfect"
  ];
  var greeting = document.querySelector(".greeting-display");
  greeting.innerText =
    loosingGreetings[getRandomInt(0, loosingGreetings.length)];
  greeting.style.color = "#db2923";
  greeting.style.opacity = "1";
}

function timerOn() {
  let timerLabel = document.querySelector(".timer-digits");
  let ss = 0;
  gTimerID = setInterval(function() {
    ss++;
    ss = ss.toString().padStart(2, "0");
    if (gGame.isOn) {
      timerLabel.innerText = gGame.secsPassed = ss;
    }
  }, 1000);
}

function radioBtnLevel(elBtn) {
  resetGame(+elBtn.value);
}

function setPlayerName(el) {
  el.preventDefault;
  if (el.value.length < 1) {
    el.value = "Player";
  }
  gGame.player = el.value;
  document.querySelector(".player-name h2").textContent = el.value;
  setPlayerNameToStorage(el.value);
  hidePlayerNameInput();
}

function showPlayerNameInput() {
  var elTxtField = document.querySelector("#name");
  elTxtField.style.display = "block";
  elTxtField.style.opacity = "1";
}

function hidePlayerNameInput() {
  var elTxtField = document.querySelector("#name");
  elTxtField.style.display = "block";
  elTxtField.style.opacity = "0";

  setTimeout(function() {
    elTxtField.style.display = "none";
    elTxtField.value = "";
  }, 400);
}

// gets last player's name from storage  if there is one

function checkLastPlayer() {
  var playerFromStorage = getPlayerNameFromStorage("player");
  if (playerFromStorage) {
    gGame.player = playerFromStorage;
    document.querySelector(".player-name h2").textContent = playerFromStorage;
    return playerFromStorage;
  } else showPlayerNameInput();
}

// TODO - Enter sets name

// function pressEnter(event) {

//   var inputFieldEmpty = document.querySelector('#name').value === ''
//   if (event.code !== 'Enter') {
//     return
//   } else {
//     console.log(event)
//     var nameInputField = document.querySelector('#name')
//     setPlayerName(nameInputField)
//   }
// }
