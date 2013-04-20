(function() {
    var fitopts = {min: 6, max: 1000};

    var nameFor = function(event) {
      return event.host ? event.host + ":" + event.service : event.service
      return event.host + ":" + event.service;
    };

    var hextoRGB = function(hex) { // converts hex string to rgb triple
      // only works for full 6 char hex, not shorthand
      if (hex[0]=="#") hex=hex.substr(1);
      var hexp = "([a-f0-9]{2})";
      var colorGroups = RegExp('^'+hexp+hexp+hexp+'$', 'i').exec(hex).slice(1);
      return _.map(colorGroups, function(color) { return parseInt(color, 16) });
    }
  
    var rateLimit = 500; // ms
  
    var TimeSeriesView = function(json) {

      var self = this;
      
      self.smoothie = new SmoothieChart({
        grid: {strokeStyle:'#ccc', fillStyle:'rgba(255, 255, 255, 0.0)', lineWidth: 1, millisPerLine: 60000},
        millisPerPixel: parseFloat(json.speed || 100),
        labels: { fillStyle:'#262626' }
      });

      // colors
      var colorTemplate = _.template("rgba({{red}},{{green}},{{blue}},{{alpha}})");

      var colorPallette = function() {
        // should be customizable in future...
        // default color pallette borrowed from http://code.shutterstock.com/rickshaw/examples/colors.html
        // Array.prototype.reduce.call(svg.childNodes, function(accum, path) { accum.push(path.getAttribute("fill")); return accum; }, [])
        var DEFAULT = ["#57306f", "#514c76", "#646583", "#738394",
                       "#6b9c7d", "#84b665", "#a7ca50", "#bfe746",
                       "#e2f528", "#fff726", "#ecdd00", "#d4b11d",
                       "#de8800", "#de4800", "#c91515", "#9a0000",
                       "#7b0429", "#580839", "#31082b"];
        return DEFAULT;
      };
      this.pallette = colorPallette();

      var takeColor = function() {
        // pops a color off the pallette stack, or regenerates the
        // stack if we're out of colors
        var color = self.pallette.shift();
        if (color) {
          return color;
        } else {
          self.pallette = colorPallette();
          return self.pallette.shift();
        }
      }

      // map event names to colors
      var colorMap = {};

      var colorFromString = function(s) {
        // caches a color in the color table
        var color = colorMap[s];
        if (color) return color;
        color = colorMap[s] = takeColor()
        return color;
      }

      var RGBfromString = function(s) {
        // returns an RGB triple from a string
        return hextoRGB(colorFromString(s));
      };

      var rgbaFromTriple = function(rgb, alpha) {
        return colorTemplate({
          red: rgb[0],
          green: rgb[1],
          blue: rgb[2],
          alpha: alpha
        });
      }

      // smoothiecharts timeseries
      var seriesCollection = {};

      // throttle appends to graph
      var appendEvent = function(series, event) {
        series.append(event);
        return series.append(new Date(event.time).getTime(), format.float(event.metric));
      };

      var createTimeSeries = function(name, event) {
        var seriesColor = RGBfromString(name),
            series = new TimeSeries(),
            color = rgbaFromTriple(seriesColor, 1),
            seriesOpts = {lineWidth: self.lineWidth || 2,
                          strokeStyle: color,
                          fillStyle: rgbaFromTriple(seriesColor, self.opacity || 0)};

        series.appendEvent = _.throttle(function(event) {
          series.append(new Date(event.time).getTime(), format.float(event.metric));
        }, rateLimit);;

         self.smoothie.addTimeSeries(series, seriesOpts);
        return series;
      };

      // stream data into series
      var intoSeries = function(event) {
        var seriesName = nameFor(event)
        var cachedSeries = seriesCollection[seriesName];

        if (cachedSeries) {
          cachedSeries.appendEvent(event);
        } else {
          var newSeries = seriesCollection[seriesName] = createTimeSeries(seriesName, event);
          newSeries.appendEvent(event);
        };
      };

      var legendCollection = {};

      var updateLegend = function(event) {
        var eventName = nameFor(event),
            cachedEl = legendCollection[eventName];

        if (cachedEl) {
          cachedEl.text(eventName + ": " + format.float(event.metric))
        } else {
          var $el = $("<div></div>");
          var color = rgbaFromTriple(RGBfromString(eventName), 0.7);
          $el.addClass('event-legend').css({"background-color": color});
          $el.text = _.throttle($el.text, rateLimit);
          setTimeout(function() {
            if ($el) {
              $el.text(eventName + ": " + format.float(event.metric));
            }
          }, +self.delay || 0);
          legendCollection[eventName] = $el;
          self.$legend.append($el)
        }
        
      }

      view.View.call(this, json);
      this.query = json.query;
      this.title = json.title;
      this.delay = json.delay;
      this.speed = json.speed;
      this.opacity = json.opacity;
      this.lineWidth = json.lineWidth;

      this.clickFocusable = true;
      this.el.append(
        '<div class="time-series-container">' +
          '<div class="legend"></div>' +
          '<div class="title">' + this.title +
          '</div>' +
          '<canvas class="timeseries"></canvas>' +
        '</div>'
      );

      this.$canvas = this.el.find(".timeseries");
      this.$legend = this.el.find(".legend");
      this.$titlecontainer = this.el.find("div.title");
      
      this.$title = this.$titlecontainer.find("h2");
      this.canvas = this.$canvas.get(0);


      this.$legend = this.el.find(".legend");

      this.reflow();

      this.smoothie.streamTo(this.canvas, this.delay);      

      if (this.query) {
        this.sub = subs.subscribe(this.query, function(event) {
          updateLegend(event)
          intoSeries(event)
        });
      }
    }

    view.inherit(view.View, TimeSeriesView);
    view.TimeSeries = TimeSeriesView;
    view.types.TimeSeries = TimeSeriesView;

    TimeSeriesView.prototype.json = function() {
      return $.extend(view.View.prototype.json.call(this), {
        type: 'TimeSeries',
        title: this.title,
        delay: this.delay,
        speed: this.speed,
        query: this.query,
        opacity: this.opacity,
        lineWidth: this.lineWidth,
      });
    }

    var editTemplate = _.template(
      '<label for="title">title</label>' +
      '<input type="text" name="title" value="{{title}}" /><br />' +
      '<label for="query">query</label>' +
      '<textarea type="text" class="query" name="query">{{ query }}</textarea><br />' +
      '<label for="lineWidth">line width</label>' +
      '<input type="text" name="lineWidth" value="{{lineWidth}}" /><br />' +
      '<label for="opacity">fill opacity</label>' +
      '<input type="text" name="opacity" value="{{opacity}}" /><br />' +
      '<label for="speed">scroll speed</label>' +
      '<input type="text" name="speed" value="{{speed}}" /><br />' +
      '<label for="delay">delay (smoother animation)</label>' +
      '<input type="text" name="delay" value="{{delay}}" />'
    )

    TimeSeriesView.prototype.editForm = function() {
      return editTemplate(this);
    }

    TimeSeriesView.prototype.reflow = function() {
      // Size metric
      var width = this.el.width();
      var height = this.el.height();
      this.$canvas.attr("width", width - 10);
      this.$canvas.attr("height", height - 10);

    }

    TimeSeriesView.prototype.delete = function() {
      if (this.sub) {
        subs.unsubscribe(this.sub);
      }
      view.View.prototype.delete.call(this);
    }
})();

