// Pane at the bottom of the dashboard for displaying events in context.

var eventPane = (function() {
  var el = $('#event-pane');
  var fixedFields = ['host', 'service', 'time', 'state', 'metric', 'ttl', 'description', 'tags'];
  var fixedTemplate =
    _.template(
      '<div class="host"><a>{{-host}}</a></div>' +
      '<div class="service"><a>{{-service}}</a></div>' +
      '<div class="state {{-state}}">{{-state}}</div>' +
      '<div class="metric">{{-metric}}</div>' +
      '<time class="absolute">{{-time}}</time>' +
      '<div class="ttl">{{-ttl}}</div>' +
      '<div class="tags">{{-tags}}</div>' +
      '<div class="description">{{-description}}</description>');

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

    var table = el.append('<table></table>');

    // Remaining fields
    _.each(event, function(value, field) {
      if (! _.contains(fixedFields, field)) {
        table.append(rowTemplate({field: field, value: value}));
      }
    });

    // Add href to <a> elements, if URLs are defined in configuration
    var lmap = {
      host: (event.host ? event.host : ''),
      service: (event.service ? event.service : '')
    }

    if (typeof(pane_host_link) !== 'undefined') {
      el.children('div.host').children('a').attr('href',
        _.template(pane_host_link)(lmap));
    }
    if (typeof(pane_service_link) !== 'undefined') {
      el.children('div.service').children('a').attr('href',
        _.template(pane_service_link)(lmap));
    }
  };

  // Hide on escape.
  keys.bind(27, hide);

  return {show: show,
          hide: hide};
})();
