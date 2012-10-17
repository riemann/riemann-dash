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
    if (this.max === "service" || this.max === "host") {
      this.currentMax = {};
    }

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

  // What is the maximum for this event?
  Grid.prototype.eventMax = function(event) {
    if (this.max === "host") {
      return this.currentMax[event.host] || -1/0;
    } else if (this.max === "service") {
      return this.currentMax[event.service] || -1/0;
    } else {
      return this.currentMax || -1/0;
    }
  }

  // Update a single jq element with information about an event.
  Grid.prototype.renderElement = function(element, event) {
    if (event === undefined) {
      return;
    }

    // State
    element.attr('class', "state box " + event.state);

    // Metric
    element.find('.metric').text(format.float(event.metric));

    // Description
    element.attr('title', event.state + ' at ' + event.time + "\n\n" +
        event.description);

    // Bar chart
    if (event.metric) {
      element.find('.bar').css('width', 
          (event.metric / this.eventMax(event) * 100) + "%");
    }
  }


  // Render a single event if there's been no change to table structure.
  Grid.prototype.partialRender = function(event) {
    var table = this.el.find('table');
    var hostIndex = this.hosts.indexOf(event.host);
    var serviceIndex = this.services.indexOf(event.service);
    var row = this.el.find('tbody tr')[hostIndex];
    var td = $($(row).find('td')[serviceIndex]);

    this.renderElement(td, event);
  }

  // Rerender the table
  Grid.prototype.render = function() {
    var table = this.el.find('table');
    table.empty();

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
        var element = $('<td><span class="metric" /><div class="bar" /></td>');
        this.renderElement(element, event);
        row.append(element);
      }, this);
    }, this);
  };

  // Update cached maxima with a new event. Returns true if maxima changed.
  Grid.prototype.updateMax = function(event) {
    if (event !== undefined &&
        (event.metric === undefined ||
         event.metric <= (this.eventMax(event) || -1/0))) {
      // We haven't bumped our max; no change.
      return false;
    }

    var e;
    if (this.max === "all") {
      this.currentMax = -1/0;
      for (host in this.events) {
        for (service in this.events[host]) {
          e = this.events[host][service];
          this.currentMax = Math.max(e.metric, this.currentMax || -1/0);
        }
      }
    } else if (this.max === "host" ) {
      this.currentMax = {};
      for (host in this.events) {
        for (service in this.events[host]) {
          e = this.events[host][service];
          this.currentMax[e.host] = 
            Math.max(e.metric, this.currentMax[e.host] || -1/0)
        }
      }
    } else if (this.max === "service") {
      this.currentMax = {};
      for (host in this.events) {
        for (service in this.events[host]) {
          e = this.events[host][service];
          this.currentMax[e.service] = 
            Math.max(e.metric, this.currentMax[e.service] || -1/0); 
        }
      }
    } else {
      this.currentMax = this.max;
      return false;
    }

    return true;
  }

  // Stores an event in the internal state tables. Returns true if we
  // haven't seen this host/service before.
  Grid.prototype.saveEvent = function(e) {
    // Host list
    if (this.hosts.indexOf(e.host) === -1) {
      this.hosts.push(e.host);
      this.hosts = _.uniq(this.hosts.sort(), true);
    }

    // Services list
    if (this.services.indexOf(e.service) === -1) {
      this.services.push(e.service);
      this.services = _.uniq(this.services.sort(), true);
    }

    // Events map
    if (this.events[e.host] === undefined) {
      // New host
      this.events[e.host] = {};
    }
    if (this.events[e.host][e.service] === undefined) {
      // New event
      var newEvent = true;
    } else {
      var newEvent = false;
    }

    // Store event
    this.events[e.host][e.service] = e;

    return newEvent;
  }

  // Add an event.
  Grid.prototype.add = function(e) {
    var newEvent = this.saveEvent(e);
    var newMax   = this.updateMax(e);

    if (newEvent || newMax) {
      this.render();
    } else {
      this.partialRender(e);
    }
  }

  // Remove an event.
  Grid.prototype.remove = function(e) {
    delete this.events[e.host][e.service];
    if (_.isEmpty(this.events[e.host])) {
      delete this.events[e.host];
    };

    // Recompute hosts
    this.hosts = _.keys(this.events).sort();

    // Recompute services
    var services = {};
    for (var host in this.events) {
      for (var service in this.events[host]) {
        services[this.events[host][service].service] = true;
      }
    }
    this.services = _.keys(services).sort();

    this.updateMax();
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
