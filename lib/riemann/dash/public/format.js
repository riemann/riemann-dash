var format = (function() {

  var formatFloat = function(number, precision, commas) {
	  if (number == null) {
		  return null;
		}
    precision = precision || 2;
    var base = Math.pow(10, precision);
    var val =  Math.round(number * base) / base;

    if(!commas) {
      return val;
    }

    var parts = (val + '').split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  var metricTemplate = _.template('<div class="bar {{state}}" style="width: {{percent}}%">{{metric}}</div>'); 
  var metric = function(e, max) {
    var max = (max || 1);
    var data = {
      'state': e.state,
      'percent': (e.metric / max * 100),
      'metric': formatFloat(e.metric)
    }
    return metricTemplate(data);
  };

  return {
    'float': formatFloat,
    'metric': metric
  }
})();
