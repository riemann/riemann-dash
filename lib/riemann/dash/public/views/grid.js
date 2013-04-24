(function() {
  var fitopts = {min: 6, max: 1000};

  // Takes a string and returns a function which extracts
  // a value from an event.
  var extract_fn = function(str) {
    // Property access
    return function(e) {
      return e[str]
    }
  }

  // Takes a string and returns either:
  // - a function which extracts a maximum value from an event.
  // - a number to be used as the constant maximum.
  var max_fn = function(str) {
    if (str === "all") {
      // Always the same value: global maxima
      return function(e) { return "all" };
    }
    if (isNaN(parseFloat(str))) {
      // Not a number. Extract a field.
      return function(e) { return e[str] };
    }
    // Return a constant number.
    return parseFloat(str);
  }

  var Grid = function(json) {
    view.View.call(this, json);
    this.query = json.query;
    this.title = json.title;
    this.max = json.max;
    this.rows_str = json.rows;
    this.cols_str = json.cols;
    this.max_fn = max_fn(json.max);
    this.row_fn = extract_fn(json.rows);
    this.col_fn = extract_fn(json.cols);
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
      rows: this.rows_str,
      cols: this.cols_str
    });
  }
  
  var editTemplate = _.template(
    "<label for='title'>Title</label>" +
    "<input type='text' name='title' value='{{title}}' /><br />" +
    "<label for='query'>Query</label><br />" +
    "<textarea name='query' class='query'>{{query}}</textarea><br />" +
    "<label for='rows'>Rows</label>" +
    "<input type='text' name='rows' value='{{rows_str}}' /><br />" +
    "<label for='cols'>Columns</label>" +
    "<input type='text' name='cols' value='{{cols_str}}' /><br />" +
    "<span class='desc'>'host' or 'service'</span><br />" +
    "<label for='max'>Max</label>" +
    "<input type='text' name='max' value='{{max}}' /><br />" +
    "<span class='desc'>'all', 'host', 'service', or any number.</span>"
  )

  Grid.prototype.editForm = function() {
    return editTemplate(this);
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
    if (typeof(this.max_fn) === "number") {
      // Absolute numeric value
      return this.max_fn;
    } else {
      // Use fn to group maxima
      var max_key = this.max_fn(event);
      return this.maxima[this.max_fn(event)] || -1/0;
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
    if (event.metric == 0) {
      // Zero
      element.find('.bar').css('width', 0);
    } else if (0 < event.metric) {
      // Positive
      element.find('.bar').css('width', 
          (event.metric / this.eventMax(event) * 100) + "%");
    } else {
      // Nil or negative
      element.find('.bar').css('width', 0);
    }
  }

  // Render a single event if there's been no change to table structure.
  Grid.prototype.partialRender = function(event) {
    var table = this.el.find('table');
    var rowIndex = this.rows.indexOf(this.row_fn(event));
    var columnIndex = this.cols.indexOf(this.col_fn(event));
    var row = this.el.find('tbody tr')[rowIndex];
    var td = $($(row).find('td')[columnIndex]);

    this.renderElement(td, event);
  }

  // A full re-rendering of the table.
  Grid.prototype.render = util.slur(200, function() {
    var table = this.el.find('table');
    table.empty();

    // Compute short names.
    var colPrefix = strings.longestCommonPrefix(this.cols);
    var rowPrefix = strings.longestCommonPrefix(this.rows);
    var colPrefixLen = colPrefix.length;
    var rowPrefixLen = rowPrefix.length;
    var shortColNames = _.map(this.cols, function(s) {
      return s.substring(colPrefixLen);
    });
    var shortRowNames = _.map(this.rows, function(s) {
      return s.substring(rowPrefixLen);
    });

    // Header
    table.append("<thead><tr><th></th></tr></thead>");
    var row = table.find("thead tr");
    shortColNames.forEach(function(name) {
      var element = $('<th>');
      element.text(name);
      row.append(element);
    });

    this.rows.forEach(function(name, i) {
      row = $("<tr><th></th>");
      table.append(row);
      row.find('th').text(shortRowNames[i]);
      this.cols.forEach(function(subName) {
        var event = this.events[name][subName];
        var element = $('<td><span class="bar"><span class="metric"/></span></td>');
        this.renderElement(element, event);
        row.append(element);
      }, this);
    }, this);
  });

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
    for (name in this.events) {
      for (subName in this.events[name]) {
        e = this.events[name][subName];
        if (e.metric && this.max_fn(e) === max_key) {
          currentMax = Math.max(currentMax, e.metric);
        }
      }
    }
    console.log("Maxima", max_key, currentMax);

    // Set new maximum.
    this.maxima[max_key] = currentMax;

    return true;
  }

  // Stores an event in the internal state tables. Returns true if we
  // haven't seen this host/service before.
  Grid.prototype.saveEvent = function(e) {
    var row_key = this.row_fn(e);
    var col_key = this.col_fn(e);

    // Update row list
    if (this.rows.indexOf(row_key) === -1) {
      this.rows.push(row_key);
      this.rows = _.uniq(this.rows.sort(), true);
    }

    // Update column list
    if (this.cols.indexOf(col_key) === -1) {
      this.cols.push(col_key);
      this.cols = _.uniq(this.cols.sort(), true);
    }

    // Update events map
    if (this.events[row_key] === undefined) {
      // New row
      this.events[row_key] = {};
    }
    var newEvent = (this.events[row_key][col_key] === undefined);

    // Store event
    this.events[row_key][col_key] = e;

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
    var row_key = this.row_fn(e);
    var col_key = this.col_fn(e);
    delete this.events[row_key][col_key];
    if (_.isEmpty(this.events[row_key])) {
      delete this.events[row_key];
    };

    // Recompute rows
    this.rows = _.keys(this.events).sort();

    // Recompute cols
    var cols = {};
    for (var row in this.events) {
      for (var col in this.events[row]) {
        cols[col] = true;
      }
    }
    this.cols = _.keys(cols).sort();

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
