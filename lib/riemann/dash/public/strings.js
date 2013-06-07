var strings = (function() {
  var longestCommonPrefix = function(strings) {
    strings = _.filter(strings, _.isString);

    if (strings.length === 0) {
      return '';
    }

    var prefix = '';
    var maxlen = _.min(_.map(strings, function(s) { return s.length }));
    var i;
    var j;
    var c;

    for (i = 0; i < maxlen; i++) {
      c = strings[0].charAt(i);
      for (j = 0; j < strings.length; j++) {
        if (strings[j].charAt(i) !== c) {
          return prefix;
        }
      }
      prefix = prefix + c;
    }

    return prefix;
  }

  // Like longestCommonPrefix, but only breaks at whitespace
  var commonPrefix = function(strings) {
    var prefix = longestCommonPrefix(strings);
    if (strings[0] && strings[0] === prefix) {
      // All strings are the same
      return prefix;
    }

    var regex = /(^.*[\s\.]+)/;
    var match = regex.exec(prefix);
    if (match) {
      return match[1];
    }
    return '';
  } 

  return {
    commonPrefix: commonPrefix,
    longestCommonPrefix: longestCommonPrefix
  }
})();
