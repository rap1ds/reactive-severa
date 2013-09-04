define([
  "jquery",
  "Bacon",
  "page"],
  function($, Bacon, page) {
  
  function toNumStream(el) {
    var initialVal = Number(el.val());
    var prop = el.asEventStream("change")
      .map(function(event) {
        var strVal = $(event.target).val().replace(',', '.');
        return Number(strVal);
      })
      .toProperty(initialVal);

    return prop;
  }

  function log(msg) {
    return function(stream) {
      stream.log(msg);
    };
  }

  function logEach(streams, msg) {
    streams.forEach(log(msg));
  }

  function nonZeroPositiveNumber(num) {
    return _.isNumber(num) && num > 0;
  }

  function disableSendIfNoProjectSelected() {

    // Elements
    var projectDropdowns = _.range(0, 4).map(function(i) { 
      return page.$project(i);
    });

    var hourRows = _.range(0, 4).map(function(row) {
      return _.range(0, 7).map(function(column) {
        return page.$grid(row, column);
      });
    });

    // Streams

    // projectSelected: 
    // Array of four streams. Each stream return true if project is selected
    var projectSelected = projectDropdowns.map(function(el) {
      var numStreams = toNumStream(el).map(function(num) {
        return !_.isNaN(num);
      });

      return numStreams;
    });

    // hourRowFilled:
    // Array of four streams. Each stream returns true, if hours are filled for the particular row
    var hourRowFilled = hourRows.map(function(inputColumns) {
      return inputColumns.map(function(el) {
        var hourInputChanged = toNumStream(el).map(nonZeroPositiveNumber);
        hourInputChanged.log("hour input changed");
        return hourInputChanged;
      }).reduce(function(a, b) {
        return a.or(b);
      });
    });

    function isValidRow(isProjectSelected, isHoursFilled) {
      return isHoursFilled ? isProjectSelected : true;
    }

    // rowOk:
    // Array of four streams. Stream returns true, if row is ok, that is hours are 
    // filled and project selected, or hours not filled
    var rowOk = _.range(0, 4).map(function(i) {
      return Bacon.combineWith(isValidRow, projectSelected[i], hourRowFilled[i]);
    });

    var allRowsOk = rowOk.reduce(function(a, b) {
      return a.and(b);
    });

    allRowsOk.onValue(function(isAllSelected) {
      if(isAllSelected) {
        page.$saveButton.removeAttr('disabled');
      } else {
        page.$saveButton.attr('disabled','disabled');
      }
    });
  };

  return {
    disableSendIfNoProjectSelected: disableSendIfNoProjectSelected
  };
});