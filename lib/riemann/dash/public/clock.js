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
      //console.log("new offset is", offset);

      clock = t;
    }
    //console.log("Clock is", clock);
  }

  var register = function(f) {
    callback_i = callback_i + 1;
    callbacks[callback_i] = f;
    return callback_i;
  }

  var unregister = function(i) {
    callbacks.delete(i);
  }

  // Automatically advance clock.
  setInterval(function() {
    offset = offset * 0.99;
    advance(new Date(new Date().valueOf() + offset));
    $.each(callbacks, function(k, f) {
      f(clock);
    });
  }, 1000);

  return {
    'clock': clock,
    'offset': offset,
    'advance': advance,
    'register': register,
    'unregister': unregister
  }
})();
