(function() {
  var fitopts = {min: 6, max: 1000};

  var Grid = function(json) {
    view.View.call(this, json);
    this.query = json.query;
    this.title = json.title;
    this.max = json.max || "all";
    this.by = json.by || "host";
    this.clickFocusable = true;

    // Initial display
    this.el.addClass('grid');
    this.el.append(
      '<h2></h2>' +
      '<div class="container"><table></table></div>'
    );
    this.box = this.el.find('.box');
    this.el.find('h2').text(this.title);
   
    // State 
    this.columns = [];
    this.rows = [];

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
      by: this.by
    });
  }

  Grid.prototype.editForm = function() {
    return Mustache.render('<label for="title">Title</label>' +
        '<input type="text" name="title" value="{{title}}" /><br />' +
        '<label for="query">Query</label><br />' +
        '<textarea name="query" class="query">{{query}}</textarea><br />' +
        '<label for="by">group by (horizontal)</label>' +
        '<input type="text" name="by" value="{{by}}" /><br />' +
        '<span class="desc">"host" or "service"</span><br />' +
        '<label for="max">Max</label>' +
        '<input type="text" name="max" value="{{max}}" /><br />' +
        '<span class="desc">"all", "host", "service", or any number.</span>',
      this);
  }

  // Returns all events, flat.
  Grid.prototype.allEvents = function() {
    var events = [];
    for (row in this.events) {
      for (column in this.events[row]) {
        events.push(this.events[row][column]);
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
    if (this.by === "host") {
      var rowIndex = this.rows.indexOf(event.host);
      var columnIndex = this.columns.indexOf(event.service);
    } else {
      var rowIndex = this.rows.indexOf(event.service);
      var columnIndex = this.columns.indexOf(event.host)
    }
    var row = this.el.find('tbody tr')[rowIndex];
    var td = $($(row).find('td')[columnIndex]);

    this.renderElement(td, event);
  }

  // Rerender the table
  Grid.prototype.render = util.slur(200, function() {
    var table = this.el.find('table');
    table.empty();

    // Header
    table.append("<thead><tr><th></th></tr></thead>");
    var row = table.find("thead tr");
    this.columns.forEach(function(name) {
      var element = $('<th>');
      element.text(name);
      row.append(element);
    });

    this.rows.forEach(function(name) {
      row = $("<tr><th></th>");
      table.append(row);
      row.find('th').text(name);
      this.columns.forEach(function(subName) {
        var event = this.events[name][subName];
        var element = $('<td><span class="bar"><span class="metric"/></span></td>');
        this.renderElement(element, event);
        row.append(element);
      }, this);
    }, this);
  });

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
      for (name in this.events) {
        for (subName in this.events[name]) {
          e = this.events[name][subName];
          this.currentMax = Math.max(e.metric, this.currentMax || -1/0);
        }
      }
    } else if (this.by == "host") {
      if (this.max == "host") {
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
      }
    } else if (this.by === "service") {
      if (this.max == "host") {
        this.currentMax = {};
        for (service in this.events) {
          for (host in this.events[service]) {
            e = this.events[service][host];
            this.currentMax[e.host] = 
              Math.max(e.metric, this.currentMax[e.host] || -1/0)
          }
        }
      } else if (this.max === "service") {
        this.currentMax = {};
        for (service in this.events) {
          for (host in this.events[service]) {
            e = this.events[service][host];
            this.currentMax[e.service] = 
              Math.max(e.metric, this.currentMax[e.service] || -1/0);
          }
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
    if (this.by === "host") {
      // Host list
      if (this.rows.indexOf(e.host) === -1) {
        this.rows.push(e.host);
        this.rows = _.uniq(this.rows.sort(), true);
      }

      // Services list
      if (this.columns.indexOf(e.service) === -1) {
        this.columns.push(e.service);
        this.columns = _.uniq(this.columns.sort(), true);
      }

      // Events map
      if (this.events[e.host] === undefined) {
        // New host
        this.events[e.host] = {};
      }
      var newEvent = (this.events[e.host][e.service] === undefined);

      // Store event
      this.events[e.host][e.service] = e;

      return newEvent;

    } else if (this.by === "service") {
      // Services list
      if (this.rows.indexOf(e.service) === -1) {
        this.rows.push(e.service);
        this.rows = _.uniq(this.rows.sort(), true);
      }

      // Host list
      if (this.columns.indexOf(e.host) === -1) {
        this.columns.push(e.host);
        this.columns = _.uniq(this.columns.sort(), true);
      }

      // Events map
      if (this.events[e.service] === undefined) {
        // New host
        this.events[e.service] = {};
      }
      var newEvent = (this.events[e.service][e.host] === undefined);

      // Store event
      this.events[e.service][e.host] = e;

      return newEvent;

    }

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
    // this.el.find('table').height(
    //   this.height() -
    //   this.el.find('h2').height()     
    // );
  }

  Grid.prototype.delete = function() {
    if (this.sub != undefined) {
      subs.unsubscribe(this.sub);
    }
    this.update = function() {};
    view.View.prototype.delete.call(this);
  }
})();
