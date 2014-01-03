(function() {
    // Reify a timeseries view from JSON 
    var FlotView = function(json) {
      // Extract state from JSON
      view.View.call(this, json);
      this.query = json.query;
      this.title = json.title;
      this.graphType = json.graphType || 'line';
      this.stackMode = json.stackMode || 'false';
      this.lineWidth = json.lineWidth || 1;
      this.timeRange = (json.timeRange * 1000) || 300000;
      
      this.font = {
        size: 11,
        lineheight: 13,
        color: "#444"
      };

      var self = this;

      // Set up HTML
      if (this.title) {
        this.el.addClass('flot');
        this.el.append('<h2></h2>' +
          '<div class="container"></div>'
        );
        this.el.find('h2').text(this.title);
        this.container = this.el.find('.container');
      } else {
        this.container = this.el;
      }

      // Create local copies of slurred functions
      this.reflowGraph = util.slur(200, this.reflowGraph);
      this.setGraphData = util.slur(1000, this.setGraphData);

      // This view can be clicked to focus on it.
      this.clickFocusable = true;

      // Time series state
      this.series = {};
      this.data = [];
    
      if (!json.virtual) {
        this.reflow();
        
        // Initialize graph
        this.setupGraph(new Date());

        this.clockSub = clock.subscribe(function(t) {
          self.trimData(t);
          self.updateTime(t);
//          self.setupGraph(t);
        });

        // Subscribe to our query
        this.sub = subs.subscribe(this.query,
            function(e) {
              self.update(e);
            }
        );
      }
    };

    // Set up our FlotView class and register it with the view system
    view.inherit(view.View, FlotView);
    view.Flot = FlotView;
    view.types.Flot = FlotView;

    // Create our Flot graph
    FlotView.prototype.setupGraph = function(t) {
      if (this.container.width() === 0 ||
          this.container.height() === 0) {
            if (this.graph != null) {
              this.graph.shutdown();
              this.graph = null;
            }
            return;
      }

      // Initialize Flot
      this.container.empty();
      this.graph = $.plot(this.container, this.data, {
        legend: {
          position: "nw",
          backgroundOpacity: 0.7,
        },
        grid: {
          borderWidth: 1,
          borderColor: "#aaa",
          color: "#444",
          backgroundColor: '#fff'
        },
        yaxis: {
          font: this.font,
          min: 0,
        }, 
        xaxis: {
          font: this.font,
          mode: "time",
          min: t - this.timeRange,
          max: t
        }
      });
    };

    // Called as the clock advances to new times.
    FlotView.prototype.updateTime = function(t) {
      if (this.graph == null) {
        this.setupGraph(t);
        return;
      }

      var axis = this.graph.getOptions().xaxes[0];
      axis.min = t - this.timeRange;
      axis.max = t;
      this.graph.setupGrid();
      this.graph.draw();
    }

    // Re-order the data list and series index to be in sorted order by label. 
    FlotView.prototype.resortSeries = function() {
      // Shorten labels
      var hostPrefix = strings.commonPrefix(_.pluck(this.data, 'riemannHost'));
      var servicePrefix = strings.commonPrefix(
          _.pluck(this.data, 'riemannService'));
      _.each(this.data, function(d) {
        d.label = d.riemannHost.substring(hostPrefix.length) + ' ' +
                  d.riemannService.substring(servicePrefix.length);
        // Empty labels are expanded back to full ones.
        if (d.label === ' ') {
          d.label = d.riemannHost + ' ' + d.riemannService;
        }
      });

      // Sort data series
      this.data.sort(function(a, b) {
        if (a.label === b.label) {
          return 0;
        } else if (a.label > b.label) {
          return 1;
        } else {
          return -1;
        }
      });

      // Rebuild series index
      this.series = {};
      _.each(this.data, function(s, i) {
        this.series[s.riemannKey] = i;
      }, this);
    };

    // Accept events from a subscription and update the dataset.
    FlotView.prototype.update = function(event) {
      // Get series for this host/service
      var key = util.eventKey(event);

      // If this is a new series, add it.
      if (this.series[key] === undefined) {
        var seriesOptions = {
          riemannKey: key,
          riemannHost: event.host || 'nil',
          riemannService: event.service || 'nil',
          shadowSize: 0,
          data: []
        };

        switch(this.graphType) {
          case 'line':
            seriesOptions.lineWidth = this.lineWidth;
            seriesOptions.lines = {
              show: true,
              fill: this.stackMode === 'true'
            };
          break;
          case 'bar':
            seriesOptions.bars = {show: true, fill: true};
          break;
        }

        if (this.stackMode === 'true') {
          seriesOptions.stack = true;
        }

        this.data.push(seriesOptions);
        this.resortSeries();
      }

      var series = this.data[this.series[key]].data;
      
      // Add event to series
      if (event.state === "expired") {
        series.push(null);
      } else if (event.metric !== undefined) {
        series.push([event.time, event.metric]);
      }
      
      this.setGraphData();
    };

    // Tells the Flot graph to use our current dataset.
    FlotView.prototype.setGraphData = function() {
      if (this.graph) {
        this.graph.setData(this.data);
      }
    };

    // Clean up old data points.
    FlotView.prototype.trimData = function(t) {
      t = t - this.timeRange;
      var empties = false;

      _.each(this.data, function(s) {
        // We leave one data point off the edge of the graph for continuity.
        while (1 < s.data.length && (s.data[1] === null || s.data[1][0] < t)) {
          s.data.shift();
        }
        // And clean up single data points if necessary.
        if (1 === s.data.length && (s.data[0] === null || s.data[0][0] < t)) {
          s.data.shift();
        } else if (0 === s.data.length) {
          empties = true;
        }
      });

      // Clean up empty datasets
      if (empties) {
        this.data = _.reject(this.data, function(s) {
          return s.data.length === 0;
        });
        this.resortSeries();
      }
    };

    // Serialize current state to JSON
    FlotView.prototype.json = function() {
      return $.extend(view.View.prototype.json.call(this), {
        type: 'Flot',
        title: this.title,
        query: this.query,
        timeRange: this.timeRange / 1000,
        graphType: this.graphType,
        stackMode: this.stackMode
      });
    };

    // HTML template used to edit this view
    var editTemplate = _.template(
      '<label for="title">title</label>' +
      '<input type="text" name="title" value="{{title}}" /><br />' +
      '<label for="graphType">Graph Type</label>' +
      '<select name="graphType">' +
        '<option value="line" {% if(graphType == \'line\') print(\'selected\') %}>Line</option>' +
        '<option value="bar" {% if(graphType == \'bar\') print(\'selected\') %}>Bar</option>' +
      '</select>' +
      '<label for="stackMode">Stack Mode</label>' +
      '<select name="stackMode">' +
        '<option value="true" {% if(stackMode == \'true\') print(\'selected\') %}>Stacked</option>' +
        '<option value="false" {% if(stackMode == \'false\') print(\'selected\') %}>Normal</option>' +
      '</select><br />' +
      '<label for="query">query</label>' +
      '<textarea type="text" class="query" name="query">{{ query }}</textarea><br />' +
      '<label for="timeRange">Time range (s)</label>' +
      '<input type="text" name="timeRange" value="{{timeRange / 1000}}" />'
    );

    // Returns the edit form
    FlotView.prototype.editForm = function() {
      return editTemplate(this);
    };

    // Redraws graph 
    FlotView.prototype.refresh = function() {
      this.graph.setupGrid();
      this.graph.draw();
    };

    // Resizes graph
    FlotView.prototype.reflowGraph = function() {
      if (this.graph) {
        this.graph.resize();
        this.graph.setupGrid();
        this.graph.draw();
      }
    };

    // Called when our parent needs to resize us
    FlotView.prototype.reflow = function() {
      this.reflowGraph();
    };

    // When the view is deleted, remove our subscription
    FlotView.prototype.delete = function() {
      if (this.clockSub) {
        clock.unsubscribe(this.clockSub);
      }
      if (this.sub) {
        subs.unsubscribe(this.sub);
      }
      view.View.prototype.delete.call(this);
    };
})();

