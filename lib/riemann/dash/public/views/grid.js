(function() {
  var fitopts = {min: 6, max: 1000};

  var Grid = function(json) {
    view.View.call(this, json);
    this.query = json.query;
    this.title = json.title;
    this.max = json.max || "all";
    this.clickFocusable = true;

    // Initial display
    this.el.addClass('grid');
    this.el.append(
      '<div class="title"></div>' +
      '<table></table>'
    );
    this.box = this.el.find('.box');
    this.el.find('.title').text(this.title);
   
    // State 
    this.hosts = [];
    this.services = [];
    this.events = {};

    // Subscribe
    if (this.query) {
      var me = this;
      this.sub = subs.subscribe(this.query, function(e) {
        me.update.call(me, e);
      });
    }
  }

  view.inherit(view.View, Grid);
  view.Grid = Grid;
  view.types.Grid = Grid;

  Grid.prototype.json = function() {
    return $.extend(view.View.prototype.json.call(this), {
      type: 'Grid',
      title: this.title,
      query: this.query,
      max: this.max,
    });
  }

  Grid.prototype.editForm = function() {
    return Mustache.render('<label for="title">Title</label>' +
        '<input type="text" name="title" value="{{title}}" /><br />' +
        '<label for="query">Query</label>' +
        '<input type="text" name="query" value="{{query}}" /><br />' +
        '<label for="max">Max</label>' +
        '<input type="text" name="max" value="{{max}}" /><br />' +
        '<span class="desc">"all", "host", "service", or any number.</span>',
      this)
  }

  // Returns all events, flat.
  Grid.prototype.allEvents = function() {
    var events = [];
    for (host in this.events) {
      for (service in this.events[host]) {
        events.push(this.events[host][service]);
      }
    }
  }

  // Rerender the table
  Grid.prototype.render = function() {
    var table = this.el.find('table');
    table.empty();

    // Compute maxima.
    var max;
    if (this.max === "all") {
      for (host in this.events) {
        for (service in this.events[host]) {
          event = this.events[host][service];
          max = Math.max(event.metric, max || 0);
        }
      }
    } else if (this.max === "host" ) {
      max = {};
      var event;
      for (host in this.events) {
        for (service in this.events[host]) {
          event = this.events[host][service];
          max[event.host] = Math.max(event.metric, max[event.host] || 0)
        }
      }
    } else if (this.max === "service") {
      max = {};
      var event;
      for (host in this.events) {
        for (service in this.events[host]) {
          event = this.events[host][service];
          max[event.service] = Math.max(event.metric, max[event.service] || 0); 
        }
      }
    } else {
      max = this.max;
    }

    // Header
    table.append("<thead><tr><th></th></tr></thead>");
    var row = table.find("thead tr");
    this.services.forEach(function(service) {
      var element = $('<th>');
      element.text(service);
      row.append(element);
    });

    this.hosts.forEach(function(host) {
      row = $("<tr><th></th>");
      table.append(row);
      row.find('th').text(host);
      this.services.forEach(function(service) {
        var event = this.events[host][service];
        if (event === undefined) {
          return;
        }
        var element = $('<td class="state metric box" />');

        // Metric
        element.text(format.float(event.metric));
        element.addClass(event.state);

        // Description
        element.attr('title', event.state + " at " + event.time + "\n\n" +
            event.description);
        
        // Bar chart
        if (event.metric) {
          element.append('<div class="bar"/>');
          var frac;
          if (this.max === "host") {
            frac = (event.metric / max[event.host]);
          } else if (this.max === "service") {
            frac = (event.metric / max[event.service]);
          } else {
            frac = (event.metric / max);
          }
          element.find('.bar').css('width', frac * 100 + "%");
        }

        row.append(element);
      }, this);
    }, this);
  };

  // Remove an event.
  Grid.prototype.remove = function(e) {
    delete this.events[e.host][e.service];
    if (_.isEmpty(this.events[e.host])) {
      delete this.events[e.host];
    };

    this.hosts = _.keys(this.events);
    this.services = _.union.apply(this,
      _.map(this.events, function(host, services) {
        return _.keys(services);
      })
    );

    this.render();
  }

  // Add an event.
  Grid.prototype.add = function(e) {
    // Update host/service lists.
    this.hosts.push(e.host);
    this.hosts = _.uniq(this.hosts.sort(), true);
    this.services.push(e.service);
    this.services = _.uniq(this.services.sort(), true);
    if (this.events[e.host] === undefined) {
      this.events[e.host] = {};
    }
    this.events[e.host][e.service] = e;

    this.render();
  }

  // Accept an event.
  Grid.prototype.update = function(e) {
    if (e.state === "expired") {
      this.remove(e);
    } else {
      this.add(e);
    }
  }

  Grid.prototype.reflow = function() {
    this.el.find('table').height(
      this.height() -
      this.el.find('.title').height()
    );
  }

  Grid.prototype.delete = function() {
    if (this.sub != undefined) {
      this.sub.close();
    }
    this.update = function() {};
    view.View.prototype.delete.call(this);
  }
})();
