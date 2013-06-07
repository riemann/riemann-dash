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
