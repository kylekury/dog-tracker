var sheet = SpreadsheetApp.openById('[SPREADSHEET_ID]').getSheets()[0];
var webhookToken = '[SLACK_WEBHOOK_TOKEN]';
var webhookUrl = '[INCOMING_WEBHOOK_URL]';
var companyName = "Unbounce";
var timezoneName = "America/Los_Angeles";
var dateFormat = "yyyy-MM-dd";
var currentDate = Utilities.formatDate(new Date(), timezoneName, dateFormat);
var dogStatus = getDogStatus();

function doPost(request) {
  var textTokenized = request.parameters.text.toString().toLowerCase().split(" ");

  var params = request.parameters;
  var response = "";

  if (params.token == webhookToken) {
    var command = textTokenized[0];
    var argument = textTokenized[1];

    if (command == "list") {
      // List all dogs
      response = listDogs();
    } else if (command == "register") {
      if (!dogRegistered(argument)) {
        // Register a dog
        response = registerDog(argument);
      } else {
        response = setDogInOffice(argument, request.parameters.user_name.toString());
      }
    } else if (command == "delete") {
      response = deleteDog(argument);
    } else if (command == "help") {
      response = getHelp();
    } else if (command != "") { // At this point we haven't matched any command, so assume the user has entered their dog's name
      if (!dogRegistered(command)) {
        // Register a dog
        registerDog(command);
      }

      response = setDogInOffice(command, request.parameters.user_name.toString());
    } else {
      // List dogs in-office
      response = getDogsInOffice();
    }
  }

  Logger.log(response);
  return ContentService.createTextOutput(response);
}

function getHelp() {
  return "Command list:" +
    "\n\t/dog - List all the dogs in the office today." +
    "\n\t/dog list - List the dogs registered @ " + companyName + "." +
    "\n\t/dog register [Dog Name] - Registers the given dog (example: /dog register bruno)." +
    "\n\t/dog delete [Dog Name] - Deletes the given dog (example: /dog delete bruno)." +
    "\n\t/dog [Dog Name] - Sets the given dog as in-office for the day (example: /dog bruno). If the dog is not registered, it will be.";
}

function listDogs() {
  var response = "Here are the dogs registered @ " + companyName + ":";

  for (var key in dogStatus) {
    response += "\n\t" + capitalize(dogStatus[key].name);
  }

  return response;
}

function dogRegistered(dogName) {
  for (var key in dogStatus) {
    if (dogStatus[key].name == dogName) {
      return true;
    }
  }

  return false;
}

function registerDog(dogName) {
  var availableRowIndex = getFirstEmptyRowByColumnArray();

  if (dogRegistered(dogName)) {
    return capitalize(dogName) + " is already registered.";
  }

  sheet.getRange('A' + availableRowIndex).setValue(dogName);
  sheet.getRange('B' + availableRowIndex).setValue("2000-01-01");

  dogStatus[dogName] = {
    name: dogName,
    inOffice: false,
    dateCell: availableRowIndex
  };

  return "Registered " + capitalize(dogName) + ". Use /dog [dogName] to set them as in-office for the day.";
}

function deleteDog(dogName) {
  for (var key in dogStatus) {
    if (dogStatus[key].name == dogName) {
      sheet.getRange('A' + dogStatus[key].dateCell).setValue("");
      sheet.getRange('B' + dogStatus[key].dateCell).setValue("");

      return capitalize(dogName) + " has been removed.";
    }
  }

  return dogName + " is not registered.";
}

function getDogsInOffice() {
  var dogsFound = false;
  var response = "The following dogs are in the office today:";
  for (var key in dogStatus) {
    if (dogStatus[key].inOffice == true) {
      response += "\n\t" + capitalize(dogStatus[key].name) + "!";
      dogsFound = true;
    }
  }

  if (!dogsFound) {
    return "No dogs in the office today :(";
  }

  return response;
}

function setDogInOffice(dogName, userName) {
  var dogCellIndex = dogStatus[dogName].dateCell;

  sheet.getRange('B' + dogCellIndex).setValue(currentDate);

  postDogInOffice(capitalize(dogName) + " is in the office today :) Thanks " + userName + "!");

  return "Thanks! " + capitalize(dogName) + " has been set to in-office for the day :)";
}

function getDogStatus() {
  // 500 is arbitrary, but safe to assume < 500 dogs in the office :P
  var dogs = sheet.getRange(1, 1, 500);

  var dogStatus = {};

  for (var i = 1; i <= 500; i++) {
    var dogCell = dogs.getCell(i, 1);

    if (dogCell.getValue() == "") {
      continue;
    }

    var dogDate = Utilities.formatDate(new Date(sheet.getSheetValues(i, 2, 1, 1)[0][0]), timezoneName, dateFormat);

    dogStatus[dogCell.getValue()] = {};
    dogStatus[dogCell.getValue()].name = dogCell.getValue();
    dogStatus[dogCell.getValue()].inOffice = dogDate == currentDate;
    dogStatus[dogCell.getValue()].dateCell = i;
  }

  return dogStatus;
}

function postDogInOffice(response) {
  var url = webhookUrl;

  var options = {
    'method': 'post',
    'payload': "{'text':'" + response + "'}"
  };

  var response = UrlFetchApp.fetch(url, options);
}

function getFirstEmptyRowByColumnArray() {
  var column = sheet.getRange('A:A');
  var values = column.getValues(); // get all data in one call
  var ct = 0;
  while ( values[ct] && values[ct][0] != "" ) {
    ct++;
  }
  return (ct+1);
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
