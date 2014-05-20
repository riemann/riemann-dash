var util = (function() {
  // Takes the value of x as a string, or if x is undefined/null, a special
  // marker string. Used because JS maps can't contain nil.
  var nullableKey = function(x) {
    return x || "\uffff";
  };

  return {
    nullableKey: nullableKey,

    // A string key uniquely identifying an event by host and service.
    eventKey: function(e) {
      return nullableKey(e.host) + "\ufffe" + nullableKey(e.service);
    },

    // Takes a string and returns a function that extracts a value from an
    // event.
    extract_fn: function(str) {
      // When null/undefined, stay null/undefined.
      if (! str) {
        return str;
      }

      // Probably the worst hack ever. I'm not documenting this because it's so
      // evil--though tremendously useful.
      if (str.match(/^fn /)) {
        // Grab the rest of the string, turn it into an anonymous fn taking a
        // single arg `e`.
        return Function.apply(null, ['e', str.substring(3)]);
      }

      // Property access
      return function(e) {
        return e[str];
      };
    },

    // Takes a string and returns either:
    // - a function which extracts a maximum value from an event.
    // - a number to be used as the constant maximum.
    max_fn: function(str) {
      if ((!str) || str === "all") {
        // Always the same value: global maxima
        return function(e) { return "all"; };
      }
      if (isNaN(parseFloat(str))) {
        // Not a number. Extract a field.
        return function(e) { return e[str]; };
      }
      // Return a constant number.
      return parseFloat(str);
    },

    // Merge two maps nondestructively.
    merge: function(m1, m2) {
      return _.extend({}, m1, m2)
    },

    // Wraps a function in another, which calls f at most once every period
    // milliseconds. Tries to minimize latency.
    slur: function(period, f) {
      var lastRun = new Date();
      lastRun.setYear(0);
      var queued = false;
      var execute = function(context, args) {
        var t1 = new Date();
        f.apply(context, args);
        lastRun = new Date();
        subs.load1(t1, lastRun);
        subs.load5(t1, lastRun);
        queued = false;
      };

      return function() {
        // If queued, do nothing
        if (queued) {
          return;
        }

        var dt = (new Date()) - lastRun;
        if (period <= dt) {
          // We're free to go
          execute(this, arguments);
        }
        else {
          // Too soon, enqueue a new job.
          queued = true;
          window.setTimeout(execute, period - dt, this, arguments);
        }
      }
    },

    // Unique-ish IDs as a length sized string of hex
    uniqueId: function(length) {
      var id = '', hex = '0123456789abcdef';
      _(length || 40).times(function() { id += hex[_.random(15)]; });
      return id;
    }
  };
})();

$(function() {
  // Allow disabling text selection.
  $.extend($.fn.disableTextSelect = function() {
    return this.each(function(){
      if($.browser.mozilla){//Firefox
        $(this).css('MozUserSelect','none');
      }else if($.browser.msie){//IE
      $(this).bind('selectstart',function(){return false;});
      }else{//Opera, etc.
      $(this).mousedown(function(){return false;});
      }
    });
  });
});
