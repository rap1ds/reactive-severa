define(["jquery", "Bacon", "timeutils", "text!html/index.html"], function($, Bacon, time, tmpl) {
  $(function() {
    var main = window.frames["main"].document;
    var mainContents = $(main).contents();
    var frame = window.frames["lista"].document;
    var frameContents = $(frame).contents();

    function loadCss(url) {
      var link = document.createElement("link");
      link.type = "text/css";
      link.rel = "stylesheet";
      link.href = url;
      frame.getElementsByTagName("head")[0].appendChild(link);
    }

    loadCss("http://localhost:8888/css/styles.css");

    var newDiv = $("<div>I'm a new div</div>");
    var body = $(body).get(0);
    var compiled = _.template(tmpl);
    $("body", frameContents).append(compiled);

    function toNumStream(selector) {
      return $(selector, frameContents)
        .asEventStream("change")
        .map(function(event) { 
          return Number($(event.target).val());
        });
    }

    function toNumProperty(selector, initial) {
      return toNumStream(selector).toProperty(initial);
    }

    function taskMinutes(hourSelector, minuteSelector) {
      return Bacon.combineWith(time.toMinutes, toNumProperty(hourSelector, 0), toNumProperty(minuteSelector, 0));
    }

    var start = Bacon.combineAsArray(toNumStream("#start-hours"), toNumStream("#start-minutes"));
    var end = Bacon.combineAsArray(toNumStream("#end-hours"), toNumStream("#end-minutes"));

    var worktime = start.combine(end, function(startTime, endTime) {
      return time.interval(startTime[0], startTime[1], endTime[0], endTime[1]);
    });

    var lunch = Bacon.combineWith(time.toMinutes, toNumProperty("#lunch-hours", 0), toNumProperty("#lunch-minutes", 0));
    var task1 = Bacon.combineWith(time.toMinutes, toNumProperty("#task1-hours", 0), toNumProperty("#task1-minutes", 0));
    var task2 = Bacon.combineWith(time.toMinutes, toNumProperty("#task2-hours", 0), toNumProperty("#task2-minutes", 0));
    var task3 = Bacon.combineWith(time.toMinutes, toNumProperty("#task3-hours", 0), toNumProperty("#task3-minutes", 0));

    _.range(1, 5)
      .forEach(function(i) {
        var selector = ["#txt", "Kuvaus", i - 1].join("_");
        var el = $(selector, mainContents);
        $("#task" + i + "-desc", frameContents)
          .asEventStream("keyup")
          .map(function(event) {
            return $(event.target).val();
          })
          .onValue(function(value) {
            el.val(value);
          });
      })

    var roundTo15 = $("#round", frameContents)
      .asEventStream("change")
      .map(function(event) {
        return $(event.target).is(':checked')
      });

    var rest = Bacon.combineWith(function(worktime, lunch, task1, task2, task3) {
      return [worktime, lunch, task1, task2, task3].reduce(function(a, b) {
        return a - b;
      });

    }, worktime, lunch, task1, task2, task3);

    rest.onValue(function(restTime) {
      $("#unmarked", frameContents).html(time.formatMinutes(restTime));
    });

    var round = $("#round", frameContents)
      .asEventStream("change")
      .map(function(event) {
        return !!event.target.checked;
      })
      .toProperty(true);

    var roundedTotal = Bacon.combineWith(function(worktime, lunch, task1, task2, task3, round) {
      var group = [worktime - lunch, task1, task2, task3];

      if(round) {
        return time.roundGroupTo(group, 15);
      } else {
        return group;
      }

    }, worktime, lunch, task1, task2, task3, round);

    var lastValue = (function() {
      var last;
      return function(day) {
        var lastDay = last;
        last = day;
        return [lastDay, day];
      }
    })();

    var dayOfWeek = new Date().getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    function setSelectDay(day) {
      $("#pickaday", frameContents).val(day);
    }

    setSelectDay(dayOfWeek);


    var day = toNumProperty("#pickaday", dayOfWeek).map(lastValue);

    Bacon.combineAsArray(roundedTotal, day).onValue(function(args) {
      var times = args[0];
      var dayValue = args[1];
      var restTime = times.reduce(function(a, b) {
        return a - b;
      });

      var severaTimes = times.map(time.toSeveraTime);

      function createSelector(day, col) {
        var selector = ["txt", "Paiva", col, day].join("_");
        return "#" + selector;
      }

      var lastDay = dayValue[0];
      var day = dayValue[1];

      if(lastDay !== undefined && lastDay !== day) {
        $(createSelector(lastDay, 0), mainContents).val("");
        $(createSelector(lastDay, 1), mainContents).val("");
        $(createSelector(lastDay, 2), mainContents).val("");
      }

      lastDay = day;

      $("#severa-time1", frameContents).html(severaTimes[1]);
      $(createSelector(day, 0), mainContents).val(severaTimes[1]);
      $("#severa-time2", frameContents).html(severaTimes[2]);
      $(createSelector(day, 1), mainContents).val(severaTimes[2]);
      $("#severa-time3", frameContents).html(severaTimes[3]);
      $(createSelector(day, 2), mainContents).val(severaTimes[3]);
      $("#severa-time-unmarked", frameContents).html(time.toSeveraTime(restTime));
      $(createSelector(day, 3), mainContents).val(time.toSeveraTime(restTime));
    });
  });
});