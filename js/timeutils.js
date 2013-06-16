define(["lodash"], function(_) {
    
    /**
        Return interval in minutes
    */
    function interval(startHours, startMinutes, endHours, endMinutes) {
        return (endHours - startHours) * 60 + (endMinutes - startMinutes); 
    }

    function pad(n) {
        return n < 10 ? "0" + n : "" + n;
    }

    function formatMinutes(minutes) {
        var isNegative = minutes < 0;
        var absMinutes = Math.abs(minutes);
        var hours = Math.floor(absMinutes / 60);
        var minutesLeftovers = absMinutes % 60;
        var str = (isNegative ? "-" : "") + [hours, pad(minutesLeftovers)].join(":");

        return isNegative ? ['<span class="negative">', str, '</span>'].join("") : str;
    }

    function toMinutes(hours, minutes) {
        return (hours * 60) + minutes;
    }

    function toSeveraTime(minutes) {
        var hours = Math.floor(minutes / 60);
        return [hours, Math.round(((minutes % 60) / 60) * 100)].join(",");
    }

    function roundGroupTo(xs, roundToNum) {

        function round(time, dir) {
            var mathFn = dir === "up" ? Math.ceil : (dir === "down" ? Math.floor : Math.round)
            return mathFn(time / roundToNum) * roundToNum;
        }

        function roundObjTo(obj, dir) {
            return {key: obj.key, val: round(obj.val, dir)};
        }

        function wrap(xs) {
            return _.map(xs, function(val, idx) {
                return {key: idx, val: val}
            });
        }

        function unwrap(xs) {
            return _(xs)
                .sortBy(function(obj) {
                    return obj.key;
                })
                .map(function(obj) {
                    return obj.val;
                })
                .value();
        }

        function getDir(sum) {
            if(sum > 0) {
                return "up";
            } else if (sum < 0) {
                return "down";
            } else {
                return null;
            }
        }

        function absRoundingEffect(num, dir) {
            var effect = Math.abs(roundingEffect(num, dir));
            return effect;
        }

        function roundingEffect(num, dir) {
            var effect = num - round(num, dir);
            return effect;
        }

        function roundAll(sum, source, target) {
            if(_.isEmpty(source)) {
                return target;
            } else {
                var dir = getDir(sum);
                // Round up
                var smallestEffect = _(source)
                    .sortBy(function(obj) {
                        return absRoundingEffect(obj.val, dir);
                    })
                    .first();

                var newSum = roundingEffect(smallestEffect.val, dir);
                var newSource = _.without(source, smallestEffect);
                var newTarget = target.concat([roundObjTo(smallestEffect, dir)]);

                return roundAll(newSum, newSource, newTarget);
            }
        }

        var workTime = _.head(xs);
        var tasks = _.rest(xs);

        var roundedWorkTime = round(workTime);

        return [roundedWorkTime].concat(unwrap(roundAll(roundingEffect(workTime), wrap(tasks), [])));
    }

    return Object.freeze({
        interval: interval,
        formatMinutes: formatMinutes,
        toMinutes: toMinutes,
        toSeveraTime: toSeveraTime,
        roundGroupTo: roundGroupTo
    });
})