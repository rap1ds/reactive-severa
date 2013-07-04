define([
  "jquery", 
  "Bacon",
  "pat",
  "timeutils",
  "ui",
  "page"
  ], function($, Bacon, pat, time, ui, page) {

  function dayOfWeek() {
    var day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }

  function disableSendIfNoProjects() {
    var props = _.range(0, 4)
      .map(function(i) {
        var project = page.$mainFrame("#addProj_ID" + i);
        var task = page.$mainFrame("#addTask_ID" + i);
        
        return [project].map(function(el) {
          var currentVal = el.val();
          var currentValBool = !_.isNaN(Number(currentVal));
          return el.asEventStream("change")
            .map(function(event) {
              return !_.isNaN(Number($(event.target).val()));
            })
            .toProperty(currentValBool);
        });
      })
      .map(function(pair) {
        return pair[0];
      });

    return props;
  }

  $(function() {

    var defaultEndHours = (new Date()).getHours();
    var defaultEndMinutes = (new Date()).getMinutes();

    ui.loadCss();
    ui.loadHtml({endHours: defaultEndHours, endMinutes: defaultEndMinutes});

    function toNumStream(selector) {
      return page.$bottomFrame(selector)
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

    var end = Bacon.combineAsArray(toNumProperty("#end-hours", defaultEndHours), toNumProperty("#end-minutes", defaultEndMinutes));

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
        var el = page.$mainFrame(selector);
        page.$bottomFrame("#task" + i + "-desc")
          .asEventStream("keyup")
          .map(function(event) {
            return $(event.target).val();
          })
          .onValue(function(value) {
            el.val(value);
          });
      })

    var roundTo15 = page.$bottomFrame("#round")
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
      page.$bottomFrame("#unmarked").html(time.formatMinutes(restTime));
    });

    var round = page.$bottomFrame("#round")
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

    function setSelectDay(day) {
      page.$bottomFrame("#pickaday").val(day);
    }

    var defaultDay = dayOfWeek();
    setSelectDay(defaultDay);

    var day = toNumProperty("#pickaday", defaultDay).map(lastValue);

    var pairs = disableSendIfNoProjects();

    Bacon.combineAsArray(roundedTotal, day, Bacon.combineAsArray(pairs)).onValue(pat()
      .caseof(_.isArray, function(args, self) { debugger; self.apply(this, args) })
      .otherwise(function(times, dayValue, pairsValues) {
        debugger;
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
          page.$mainFrame(createSelector(lastDay, 0)).val("");
          page.$mainFrame(createSelector(lastDay, 1)).val("");
          page.$mainFrame(createSelector(lastDay, 2)).val("");
          page.$mainFrame(createSelector(lastDay, 3)).val("");
        }

        page.$bottomFrame("#severa-time1").html(severaTimes[1]);
        page.$mainFrame(createSelector(day, 0)).val(severaTimes[1]);
        page.$bottomFrame("#severa-time2").html(severaTimes[2]);
        page.$mainFrame(createSelector(day, 1)).val(severaTimes[2]);
        page.$bottomFrame("#severa-time3").html(severaTimes[3]);
        page.$mainFrame(createSelector(day, 2)).val(severaTimes[3]);
        page.$bottomFrame("#severa-time-unmarked").html(time.toSeveraTime(restTime));
        page.$mainFrame(createSelector(day, 3)).val(time.toSeveraTime(restTime));

        var save = page.$mainFrame("input[class='button']");
        save.removeAttr('disabled');

        // UGLY, FIX, NOW!
        severaTimes[4] = time.toSeveraTime(restTime);

        _.range(0, 4).forEach(function(i) {
          if(severaTimes[i + 1] !== "0,0") {
            if(!pairsValues[i]) {
              save.attr('disabled','disabled');
            } else {
              save.removeAttr('disabled');
            }
          }
        });
      })
    );
  });
});