// Pane at the bottom of the dashboard for displaying events in context.

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
      '<span class="ttl">{{-ttl}}</span>' +
      '<span class="tags">{{-tags}}</span>' +
      '</div>' +
      '<div class="description">{{-description}}</div>');

  var rowTemplate =
        _.template("<tr><td>{{-field}}</td><td>{{-value}}</td></tr>");

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
