var profile = (function() {
  // Instrumentation for how much time we spend doing things. With 0 args,
  // returns current busy fraction. With a start and stop time in milliseconds, 
  // updates the current busy fraction.

  // Returns a load meter with a sampling period in ms.
  var load = function(period) {
    // Start of the sample interval
    var interval = 0;

    // Fraction of time busy
    var load = 0;
    var acc = 0;

    return function(t1, t2) {
      if (t1 === undefined) {
        return load;
      }

      if (interval < t2) {
        interval = (Math.floor(t2 / period) * period) + period;
        load = acc / period;
        acc = 0;
      }

      acc += (t2 - t1);
    }
  };

  return {
    load: load
  };
})();
