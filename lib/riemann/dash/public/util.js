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
