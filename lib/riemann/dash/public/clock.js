// Global clock
var clock = (function() {
  var clock = new Date();
  var offset = 0;
  var callback_i = 0;
  var callbacks = {};

  var advance = function(t) {
    if (clock < t) {
      // New local offset
      offset = t - (new Date());
//      console.log("new offset is", offset);

      clock = t;
//      console.log("Clock advanced to", t / 1000);
    }
  }

  var subscribe = function(f) {
    callback_i = callback_i + 1;
    callbacks[callback_i] = f;
    return callback_i;
  }

  var unsubscribe = function(i) {
    delete callbacks[i];
  }

  // Automatically advance clock.
  setInterval(function() {
    t1 = new Date();
    offset = offset * 0.99;
    advance(new Date(t1.valueOf() + offset));
    $.each(callbacks, function(k, f) {
      f(clock);
    });
    t2 = new Date();
    subs.load1(t1, t2);
    subs.load5(t1, t2);
  }, 1000);

  return {
    'clock': clock,
    'offset': offset,
    'advance': advance,
    'subscribe': subscribe,
    'unsubscribe': unsubscribe
  }
})();
