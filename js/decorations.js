define([
  "jquery", 
  "Bacon", 
  "page"], 
  function($, Bacon, page) {
  
  function toNumStream(el) {
    var initialVal = Number(el.val());
    var prop = el.asEventStream("change")
      .map(function(event) {
        return Number($(event.target).val());
      })
      .toProperty(initialVal);

    return prop;
  }

  function nonZeroPositiveNumber(num) {
    return _.isNumber(num) && num > 0;
  }

  function disableSendIfNoProjectSelected() {
    
    var projectDropdowns = _.range(0, 4).map(function(i) { 
      return page.$project(i);
    });

    var projectProperties = projectDropdowns.map(function(el) {
      debugger;
      var numStreams = toNumStream(el).map(function(num) {
        debugger;
        return !_.isNaN(num);
      });

      numStreams.log("project prop");

      return numStreams;
    });

    var inputRows = _.range(0, 4).map(function(row) {
      return _.range(0, 7).map(function(column) {
        return page.$grid(row, column);
      });
    });

    var inputRowStreams = inputRows.map(function(inputColumns) {
      return inputColumns.map(function(el) {
        return toNumStream(el).map(nonZeroPositiveNumber);
      }).reduce(function(a, b) {
        return a.or(b);
      });
    });

    var rows = _.range(0, 4).map(function(i) {
      return Bacon.combineWith(function(project, columns) {
        if(columns) {
          return project;
        } else {
          return true;
        }
      }, projectProperties[i], inputRowStreams[i]).log("rows " + i);
    }).reduce(function(a, b) {
      return a.and(b);
    });

    rows.onValue(function(isAllSelected) {
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