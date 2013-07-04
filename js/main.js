define([
  "jquery", 
  "Bacon",
  "pat",
  "timeutils", 
  "text!html/index.html", 
  "text!css/styles.css"], function($, Bacon, pat, time, tmpl, css) {
  
  var mainFrameContents = $(window.frames["main"].document).contents();
  var bottomFrameContents = $(window.frames["lista"].document).contents();

  function $mainFrame(selector) {
    return $(selector, mainFrameContents)
  }

  function $bottomFrame(selector) {
    return $(selector, bottomFrameContents);
  }

  // Load CSS (append style element to head)
  function loadCss(css) {
      var head = $bottomFrame('head'),
          style = document.createElement('style');

      style.type = 'text/css';
      if (style.styleSheet){
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      head.append(style);
    }

  function loadHtml(tmpl, data) {
    var compiled = _.template(tmpl, data);
    $("body", bottomFrameContents).append(compiled);
  }

  function dayOfWeek() {
    var day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }

  function disableSendIfNoProjects() {
    var props = _.range(0, 4)
      .map(function(i) {
        var project = $mainFrame("#addProj_ID" + i);
        var task = $mainFrame("#addTask_ID" + i);
        
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

    loadCss(css);
    loadHtml(tmpl, {endHours: defaultEndHours, endMinutes: defaultEndMinutes});

    function toNumStream(selector) {
      return $(selector, bottomFrameContents)
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
        var el = $(selector, mainFrameContents);
        $("#task" + i + "-desc", bottomFrameContents)
          .asEventStream("keyup")
          .map(function(event) {
            return $(event.target).val();
          })
          .onValue(function(value) {
            el.val(value);
          });
      })

    var roundTo15 = $("#round", bottomFrameContents)
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
      $("#unmarked", bottomFrameContents).html(time.formatMinutes(restTime));
    });

    var round = $("#round", bottomFrameContents)
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
      $("#pickaday", bottomFrameContents).val(day);
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
          $(createSelector(lastDay, 0), mainFrameContents).val("");
          $(createSelector(lastDay, 1), mainFrameContents).val("");
          $(createSelector(lastDay, 2), mainFrameContents).val("");
          $(createSelector(lastDay, 3), mainFrameContents).val("");
        }

        $("#severa-time1", bottomFrameContents).html(severaTimes[1]);
        $(createSelector(day, 0), mainFrameContents).val(severaTimes[1]);
        $("#severa-time2", bottomFrameContents).html(severaTimes[2]);
        $(createSelector(day, 1), mainFrameContents).val(severaTimes[2]);
        $("#severa-time3", bottomFrameContents).html(severaTimes[3]);
        $(createSelector(day, 2), mainFrameContents).val(severaTimes[3]);
        $("#severa-time-unmarked", bottomFrameContents).html(time.toSeveraTime(restTime));
        $(createSelector(day, 3), mainFrameContents).val(time.toSeveraTime(restTime));

        var save = $mainFrame("input[class='button']");
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