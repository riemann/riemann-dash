var format = (function() {

  var formatFloat = function(number, precision) {
    precision = precision || 2;
    var base = Math.pow(10, precision);
    return Math.round(number * base) / base;
  }

  var metricTemplate = '<div class="bar {{class}}" style="width: {{percent}}%">{{metric}}</div>';
  var metric = function(e, max) {
    var max = (max || 1);
    var data = {
      'class': e.state,
      'percent': (e.metric / max * 100),
      'metric': formatFloat(e.metric)
    }
    return Mustache.render(metricTemplate, data);
  };

  return {
    'float': formatFloat,
    'metric': metric
  }
})();
