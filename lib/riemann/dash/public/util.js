var util = (function() {
  return {
    merge: function(m1, m2) {
      // Merge two maps nondestructively.
      return _.extend({}, m1, m2)
    },
    slur: function(period, f) {
      // Wraps a function in another, which calls f at most once every period
      // milliseconds. Tries to minimize latency.

      var lastRun = new Date();
      lastRun.setYear(0);
      var queued = false;
      var execute = function(context, args) {
        f.apply(context, args);
        lastRun = new Date();
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
          window.setTimeout(execute, period - dt, this, arguments);
        }
      }
    },
    uniqueId: function(length) {
      // Unique-ish IDs as a length sized string of hex
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
