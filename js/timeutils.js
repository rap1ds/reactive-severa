define(function() {
    
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
        var hours = Math.floor(minutes / 60);
        var minutes = minutes % 60;

        return [hours, pad(minutes)].join(":");
    }

    return Object.freeze({
        interval: interval,
        formatMinutes: formatMinutes
    });
})