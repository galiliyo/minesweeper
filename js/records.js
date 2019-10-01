"use strict";

function updateRecordes(level, player, time) {
  const NUMBER_OF_RECORDS = 5;
  var records = getRecordsFromStorage();
  var levelRecords = records[`level_${level.toString()}`];
  var lastGameObj = {
    name: player,
    time: time
  };

  // // if this is a new record larger display TODO
  // if (isNewRecord(level, time)) {
  //   // handle new record display
  //   console.log('new record', lastGameObj.time, lastGameObj.name)
  // }

  ///////// maintining the list of records

  if (levelRecords.length < NUMBER_OF_RECORDS) {
    levelRecords.push(lastGameObj);
  }
  // if new result is better than the 5th place - insert it to array and pop the last one out
  else if (
    levelRecords.length >= NUMBER_OF_RECORDS &&
    time < levelRecords[NUMBER_OF_RECORDS - 1].time
  )
    levelRecords.splice(NUMBER_OF_RECORDS - 1, 1, lastGameObj);

  // Sort records array by time
  levelRecords.sort(function(record_1, record_2) {
    return record_1.time - record_2.time;
  });
  // update leaderboard

  // save array
  setRecordsToStorage(records);
  return records;
}

function getRecordsFromStorage() {
  var records = JSON.parse(window.localStorage.getItem("records"));
  if (records) return records;
  else {
    window.localStorage.clear();
    // if there are no records - then create a records obj
    return {
      level_1: [],
      level_2: [],
      level_3: []
    };
  }
}

function setRecordsToStorage(records) {
  return window.localStorage.setItem("records", JSON.stringify(records));
}

function isNewRecord(level, time) {
  if (isNaN(level) || isNaN(time)) return false;

  var records = getRecordsFromStorage();
  var levelRecords = records[`level_${level.toString()}`];

  if (levelRecords.length < 2) return false;
  return time <= levelRecords[0].time;
}
