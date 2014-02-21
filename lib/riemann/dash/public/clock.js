// Global clock
var clock = (function() {
  // We keep track of two clocks here. The stream clock is the most recent time
  // from the streaming system. The official clock is what time we *think* it
  // is.
  var stream_clock = 0;
  var clock = new Date();

  // If we *stop* receiving updates from the stream clock, we still want time
  // to advance--but gradually, we want to reconverge on the local system
  // clock. The last stream clock update is used to track how long it's been
  // since we last advanced the stream clock.
  var last_stream_clock_update = new Date(0);

  // Over this many milliseconds, we want to converge on the current time.
  var convergence_time = 60000;

  // Callback_i is used to uniquely identify each callback so we can
  // unsubscribe to clock updates.
  var callback_i = 0;

  // A map of callback indices to callback functions.
  var callbacks = {};

  // Advance the clock to a new time.
  var advance = function(t) {
    if (stream_clock < t) {
      // This is the highest value ever received for the stream clock.
      stream_clock = t;
      // console.log("New stream clock:", stream_clock);
      last_stream_clock_update = new Date();
    }
  }

  // Create a new subscription. Returns a subscription key used to unsubscribe.
  var subscribe = function(f) {
    callback_i = callback_i + 1;
    callbacks[callback_i] = f;
    return callback_i;
  }

  // Unsubscribes a given subscription, by ID.
  var unsubscribe = function(i) {
    delete callbacks[i];
  }

  // Automatically advance clock.
  setInterval(function() {
    // What time is the local system?
    var now = new Date();

    // What time does the stream clock think it is?
    var stream_now = stream_clock + (now - last_stream_clock_update);

    // What fraction of the convergence window has elapsed?
    var convergence_fraction =
      Math.min(1, (now - last_stream_clock_update) / convergence_time);

    // console.log("Convergence:", convergence_fraction);
    // console.log("Clock offset:", stream_now - now);

    // The effective clock is the current stream time, plus the delta from the
    // stream time to the local time, multiplied by the convergence fraction.
    clock = stream_now + ((now - stream_now) * convergence_fraction);

    $.each(callbacks, function(k, f) {
      f(clock);
    });

    t2 = new Date();
    subs.load1(now, t2);
    subs.load5(now, t2);
  }, 1000);

  return {
    'clock': clock,
    'stream_clock': stream_clock,
    'advance': advance,
    'subscribe': subscribe,
    'unsubscribe': unsubscribe
  }
})();
