define(["Bacon", "timeutils"], function(Bacon, time) {
  $(function() {
    var startHours = 
      $("#start-hours")
        .asEventStream("change")
        .map(function(event) { 
          return Number($(event.target).val());
        });

    var startMinutes = 
      $("#start-minutes")
        .asEventStream("change")
        .map(function(event) { 
          return Number($(event.target).val());
        });

    var start = Bacon.combineAsArray(startHours, startMinutes);
    
    var endHours = 
      $("#end-hours")
        .asEventStream("change")
        .map(function(event) { 
          return Number($(event.target).val());
        });

    var endMinutes = 
      $("#end-minutes")
        .asEventStream("change")
        .map(function(event) { 
          return Number($(event.target).val());
        });

    var end = Bacon.combineAsArray(endHours, endMinutes);

    var worktime = start.combine(end, function(startTime, endTime) {
      return time.interval(startTime[0], startTime[1], endTime[0], endTime[1]);
    });

    worktime.onValue(function(minutes) {
      $("#unmarked").text(time.formatMinutes(minutes));
    });

    worktime.onValue(function(v) { alert(v)})

  });
});