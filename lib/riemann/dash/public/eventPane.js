// Pane at the bottom of the dashboard for displaying events in context.

function format_ttl(ttl) {
  if (parseInt(ttl) != ttl) {
    return ttl;
  }

  if (ttl > 3600 * 48) {
    return (ttl / 3600 / 24).toFixed(1) + " days";
  } else if (ttl > 3600 * 2) {
    return (ttl / 3600).toFixed(1) + " hours";
  } else if (ttl > 60 * 2) {
    return (ttl / 60).toFixed(1) + " minutes";
  }
  return ttl + " seconds";
}
var eventPane = (function() {
  var el = $('#event-pane');
  var fixedFields = ['host', 'service', 'time', 'state', 'metric', 'ttl', 'description', 'tags'];
  var fixedTemplate =
    _.template(
      '<div>' +
      '<span class="host">{{-host}}</span>' +
      '<span class="service">{{-service}}</span>' +
      '<span class="state {{-state}}">{{-state}}</span>' +
      '<span class="metric">{{-metric}}</span>' +
      '<time class="absolute">{{-time}}</time>' +
      '<span class="ttl">{{-format_ttl(ttl)}}</span>' +
      '<span class="tags">{{-tags}}</span>' +
      '</div>' +
      '<pre class="description">{{-description}}</pre>');

  var rowTemplate =
        _.template('<tr><td class="field-name">{{-field}}</td><td>{{-value}}</td></tr>');

  // Hide the pane
  var hide = function() {
    if (el.hasClass("active")) {
      el.empty();
      el.removeClass("active");
    }
  };

  // Show an event in the pane
  var show = function(event) {
    hide();

    if (! el.hasClass("active")) {
      el.addClass("active");
    }

    el.append(
        fixedTemplate(
          _.defaults(
            util.merge(event, {time: new Date(event.time)}),
            {host: "nil",
             service: "nil",
             state: "nil",
             metric: "nil",
             ttl: "nil",
            tags: "nil",
            description: "nil"})));

    var table = '<table>'

    // Remaining fields
    _.each(event, function(value, field) {
      if (! _.contains(fixedFields, field)) {
        table += rowTemplate({field: field, value: value});
      }
    });

    table += '</table>';

    el.append(table);
  };

  // Hide on escape.
  keys.bind(27, hide);

  return {show: show,
          hide: hide};
})();
