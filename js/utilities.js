"use strict";

// Returns location obj from a specific cell
function getLocationFromElement(elCell) {
  var locationArray = elCell.getAttribute("data-location").split(",");
  var i = +locationArray[0];
  var j = +locationArray[1];
  var location = {
    i: i,
    j: j
  };
  return location;
}

// Returns the class name for a specific cell
function getLocationData(location) {
  var locationData = location.i + "," + location.j;
  return locationData;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function utilPrintToConsole() {
  var mat = [];
  for (var i = 0; i < gLevel.SIZE; i++) {
    mat[i] = [];
    for (var j = 0; j < gLevel.SIZE; j++) {
      var str = "";
      var cell = gBoard[i][j];
      if (cell.isMine) str += "** ";
      str += cell.minesAroundCount;
      mat[i][j] = str;
    }
  }
  console.table(mat);
}

function utilCountMines() {
  var mineCount = 0;
  for (var i = 0; i < gLevel.SIZE; i++) {
    for (var j = 0; j < gLevel.SIZE; j++) {
      if (gBoard[i][j].isMine) mineCount++;
    }
  }
  console.log(`there are ${mineCount} mines`);
}

function utilSetMockRecords() {
  var input = prompt("Enter Level, Name, Time");
  var arr = input.split(",");
  if (isNewRecord(+arr[0], +arr[2]))
    console.log(`New Record for Level ${+arr[0]}`);
  updateRecordes(+arr[0], arr[1], +arr[2]);
  utilPrintRecords();
}

function utilPrintRecords() {
  var records = getRecordsFromStorage();

  console.log("level_1");
  console.table(records["level_1"]);
  console.log("-------------\n");

  console.log("level_2");
  console.table(records["level_2"]);
  console.log("-------------\n");

  console.log("level_3");
  console.table(records["level_3"]);
}

function getPlayerNameFromStorage() {
  return JSON.parse(window.localStorage.getItem("player"));
}

function setPlayerNameToStorage(player) {
  return window.localStorage.setItem("player", JSON.stringify(player));
}
