(function() {
  var fitopts = {min: 6, max: 1000};

  var Grid = function(json) {
    // We want a per-grid slurred rendering.
    this.render = util.slur(500, this.render);

    view.View.call(this, json);
    this.query = json.query;
    this.title = json.title;
    this.max = json.max;
    this.rows_str = json.rows;
    this.cols_str = json.cols;
    this.max_fn = util.max_fn(json.max);
    this.row_sort = json.row_sort || "lexical";
    this.col_sort = json.col_sort || "lexical";
    this.row_fn = util.extract_fn(json.rows) || util.extract_fn('host');
    this.col_fn = util.extract_fn(json.cols) || util.extract_fn('service');
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
    this.cols = [];
    this.rows = [];
    // events[row_key][col_key] = event
    this.events = {};
    // maxima[maxima_value] = 500
    this.maxima = {};

    // Subscribe
    if (this.query) {
      var me = this;
      this.sub = subs.subscribe(this.query, function(e) {
        me.update.call(me, e);
      });
    }
  };

  view.inherit(view.View, Grid);
  view.Grid = Grid;
  view.types.Grid = Grid;

  Grid.prototype.json = function() {
    return $.extend(view.View.prototype.json.call(this), {
      type: 'Grid',
      title: this.title,
      query: this.query,
      max: this.max,
      rows: this.rows_str,
      cols: this.cols_str,
      row_sort: this.row_sort,
      col_sort: this.col_sort
    });
  };

  var editTemplate = _.template(
    "<label for='title'>Title</label>" +
    "<input type='text' name='title' value=\"{{-title}}\" /><br />" +
    "<label for='query'>Query</label><br />" +
    "<textarea name='query' class='query'>{{-query}}</textarea><br />" +
    "<label for='rows'>Rows</label>" +
    "<input type='text' name='rows' value=\"{{-rows_str}}\" /><br />" +
    "<label for='cols'>Columns</label>" +
    "<input type='text' name='cols' value=\"{{-cols_str}}\" /><br />" +
    "<span class='desc'>'host' or 'service'</span><br />" +
    "<label for='row_sort'>Sort rows</label>" +
    "<select name='row_sort'>" +
      "<option value='lexical' {{row_sort_lexical}}>Lexically</option>" +
      "<option value='metric' {{row_sort_metric}}>By metric</option>" +
    "</select><br />" +
    "<label for='col_sort'>Sort columns</label>" +
    "<select name='col_sort'>" +
      "<option value='lexical' {{col_sort_lexical}}>Lexically</option>" +
      "<option value='metric' {{col_sort_metric}}>By metric</option>" +
    "</select><br />" +
    "<label for='max'>Max</label>" +
    "<input type='text' name='max' value=\"{{-max}}\" /><br />" +
    "<span class='desc'>'all', 'host', 'service', or any number.</span>"
  );

  Grid.prototype.editForm = function() {
    return editTemplate(
        util.merge(this, {
          row_sort_lexical: (this.row_sort === "lexical" ? "selected" : ""),
          row_sort_metric:  (this.row_sort === "metric" ? "selected" : ""),
          col_sort_lexical: (this.col_sort === "lexical" ? "selected" : ""),
          col_sort_metric:  (this.col_sort === "metric" ? "selected" : "")
        }));
  };

  // What is the maximum for this event?
  Grid.prototype.eventMax = function(event) {
    if (typeof(this.max_fn) === "number") {
      // Absolute numeric value
      return this.max_fn;
    } else {
      // Use fn to group maxima
      return this.maxima[this.max_fn(event)] || 1/0;
    }
  };

  // Recomputes all maxima.
  Grid.prototype.refreshMaxima = function() {
    if (typeof(this.max_fn) === "number") {
      // We're done; no need to update a fixed maximum.
      return;
    }

    this.maxima = {};
    var e;
    var max_key;
    var current_max;
    for (var row in this.events) {
      for (var col in this.events[row]) {
        e = this.events[row][col];
        if (e.metric) {
          max_key = this.max_fn(e);
          current_max = this.maxima[max_key];
          if ((current_max === undefined) || (current_max < e.metric)) {
            this.maxima[max_key] = e.metric;
          }
        }
      }
    }
  }

  // Update cached maxima with a new event. Returns true if maxima changed.
  Grid.prototype.updateMax = function(event) {
    if (typeof(this.max_fn) === "number") {
      // Absolute maximum; no need to recompute anything.
      return false;
    }

    if (event.metric === undefined) {
      // No metric present
      return false;
    }

    var max_key = this.max_fn(event);

    if (this.maxima[max_key] && (event.metric <= this.maxima[max_key])) {
      // We haven't bumped our max; no change.
      return false;
    }

    // Traverse all events looking for a match.
    var e;
    var currentMax = -1/0;
    for (var name in this.events) {
      for (var subName in this.events[name]) {
        e = this.events[name][subName];
        if (e.metric && this.max_fn(e) === max_key) {
          currentMax = Math.max(currentMax, e.metric);
        }
      }
    }

    // Set new maximum.
    this.maxima[max_key] = currentMax;

    return true;
  };

  // Full refresh of column list
  Grid.prototype.refreshCols = function() {
    var cols = {};
    for (var row in this.events) {
      for (var col in this.events[row]) {
        cols[col] = Math.max(
            (cols[col] || -1/0), this.events[row][col].metric);
      }
    }
    if (this.col_sort === "lexical") {
      this.cols = _.keys(cols).sort();
    } else {
      this.cols = _.sortBy(_.keys(cols), function(c) { return -cols[c]; });
    }
  };

  // Full refresh of row list
  Grid.prototype.refreshRows = function() {
    if (this.row_sort === "lexical") {
      this.rows = _.keys(this.events).sort();
    } else {
      var rows = {};
      for (var row in this.events) {
        for (var col in this.events[row]) {
          rows[row] = Math.max(
              (rows[row] || -1/0), this.events[row][col].metric);
        }
      }
      this.rows = _.sortBy(_.keys(rows), function(r) { return -rows[r]; });
    }
  };

  // Returns a td for the given element.
  Grid.prototype.renderElement = function(event) {
    if (event === undefined) {
      // Nuke element
      return $('<td></td>');
    }

    var td = $('<td><span class="bar"><span class="metric"/></span></td>');
    var bar = td.find('.bar');
    var metric = td.find('.metric');

    // Event pane
    td.click(function(_) { eventPane.show(event); });

    // State
    td.attr('class', "state box " + event.state);

    // Description
    td.attr('title', event.host + ' ' + event.service + "\n" + event.state +
        "\nreceived at " + new Date(event.time).toString() +
        "\nexpiring at " + new Date(event.time + event.ttl * 1000).toString() +
        (event.description ? ("\n\n" + event.description) : ""));

    // Metric
    if (event.metric != undefined) {
      metric.text(format.float(event.metric));
    } else if (event.state != undefined) {
      metric.text(event.state);
    }

    // Bar chart
    if (event.metric === null ||
        event.metric === undefined ||
        event.metric <= 0) {
      bar.css('width', 0);
    } else {
      // Positive
      bar.css('width',
          (event.metric / this.eventMax(event) * 100) + "%");
    }

    return td;
  };

  // A full re-rendering of the table.
  Grid.prototype.render = function() {
    // Update data model
    this.refreshMaxima();
    this.refreshRows();
    this.refreshCols();

    var table = this.el.find('table');
    table.empty();

    var shortColNames = strings.shorten(strings.commonPrefix, this.cols);
    var shortRowNames = strings.shorten(strings.commonPrefix, this.rows);

    // Header
    table.append("<thead><tr><th></th></tr></thead>");
    var row = table.find("thead tr");
    shortColNames.forEach(function(name) {
      var element = $('<th>');
      element.text(name || 'nil');
      row.append(element);
    });

    this.rows.forEach(function(rowName, i) {
      row = $("<tr><th></th>");
      row.find('th').text(shortRowNames[i] || 'nil');
      this.cols.forEach(function(colName) {
        row.append(this.renderElement(this.events[rowName][colName]));
      }, this);
      table.append(row);
    }, this);
  };

  // Stores an event in the internal state tables. Returns true if we
  // haven't seen this host/service before.
  Grid.prototype.saveEvent = function(e) {
    var row_key = this.row_fn(e);
    var col_key = this.col_fn(e);

    // Update events map
    if (this.events[row_key] === undefined) {
      // New row
      this.events[row_key] = {};
    }
    var newEvent = (this.events[row_key][col_key] === undefined);

    // Store event
    this.events[row_key][col_key] = e;

    return newEvent;
  };

  // Add an event.
  Grid.prototype.add = function(e) {
    var newEvent = this.saveEvent(e);
    var newMax   = this.updateMax(e);

    if (newEvent || newMax) {
      this.render();
    } else {
//      this.partialRender(e);
      this.render();
    }
  };

  // Remove an event.
  Grid.prototype.remove = function(e) {
    var row_key = this.row_fn(e);
    var col_key = this.col_fn(e);

    // Remove from events table.
    if (this.events[row_key]) {
      delete this.events[row_key][col_key];
      if (_.isEmpty(this.events[row_key])) {
        delete this.events[row_key];
      }
    }

    this.render();
  };

  // Accept an event.
  Grid.prototype.update = function(e) {
    if (e.state === "expired") {
      this.remove(e);
    } else {
      this.add(e);
    }
  };

  Grid.prototype.delete = function() {
    if (this.sub !== undefined) {
      subs.unsubscribe(this.sub);
    }
    this.update = function() {};
    view.View.prototype.delete.call(this);
  };
})();
