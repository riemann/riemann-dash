var util = (function() {
  // Unique IDs
  var uniqueId = function(bytes) {
    bytes = bytes || 20;
    var s = '';
    for (var i = 0; i < bytes * 2; i++) {
      s += Math.floor(Math.random() * 16).toString(16);
    }
    return s;
  }

  // Merge two maps nondestructively.
  var merge = function(m1, m2) {
    return _.extend(_.clone(m1), m2);
  }

  // Wraps a function in another, which calls f at most once every period
  // milliseconds. Tries to minimize latency.
  var slur = function(period, f) {
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
      } else {
        // Too soon, enqueue a new job.
        window.setTimeout(execute, period - dt, this, arguments);
      }
    }
  }

  return {
    merge: merge,
    slur: slur,
    uniqueId: uniqueId
  }
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
