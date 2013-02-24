var util = (function() {
  return {
    merge: function(m1, m2) {
      // Merge two maps nondestructively.
      return _.extend({}, m1, m2)
    },
    slur: function(period, f) {
      // Wraps a function in another, which calls f at most once every period
      // milliseconds. Tries to minimize latency.
      return _.debounce(f, period)
    },
    // Unique IDs
    uniqueId: _.uniqueId
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
