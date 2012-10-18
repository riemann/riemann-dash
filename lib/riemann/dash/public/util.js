var util = (function() {
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

  return {
    merge: merge,
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
