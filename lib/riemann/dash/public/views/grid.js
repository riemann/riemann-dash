(function() {
  var fitopts = {min: 6, max: 1000};

  var Grid = function(json) {
    view.View.call(this, json);
    this.query = json.query;
    this.title = json.title;
    this.clickFocusable = true;
    this.el.addClass('grid');
    this.el.append(
      '<div class="title"></div>' +
      '<table></table>'
    );

    this.box = this.el.find('.box');
    this.el.find('.title').text(this.title);
    
    this.hosts = [];
    this.services = [];
    this.events = {};

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
      query: this.query
    });
  }

  Grid.prototype.editForm = function() {
    return Mustache.render('<label for="title">Title</label>' +
        '<input type="text" name="title" value="{{title}}" /><br />' +
        '<label for="query">Query</label>' +
        '<input type="text" name="query" value="{{query}}" />',
      this)
  }

  // Rerender the table
  Grid.prototype.render = function() {
    var table = this.el.find('table');
    table.empty();

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
        element.text(format.float(event.metric));
        element.addClass(event.state);
        element.attr('title', event.state + " at " + event.time + "\n\n" +
            event.description);
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
    if (this.sub) {
      this.sub.close();
    }
    view.View.prototype.delete.call(this);
  }
})();
