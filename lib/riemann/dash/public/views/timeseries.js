(function() {
    var fitopts = {min: 6, max: 1000};

    var TimeSeriesView = function(json) {
      view.View.call(this, json);
      this.query = json.query;
      this.title = json.title;
      this.delay = json.delay;
      this.lineWidth = json.lineWidth;
      this.strokeStyle = json.strokeStyle;
      this.fillStyle = json.fillStyle;

      this.clickFocusable = true;
      this.el.addClass('timeseries');
      this.el.append(
        '<div class="box">' +
          '<div class="title">' +
            '<h2>' + this.title + '</h2>' +
          '</div>' +
          '<canvas class="timeseries"></canvas>' +
        '</div>'
      );

      this.$canvas = this.el.find(".timeseries");
      this.$titlecontainer = this.el.find("div.title");
      this.$titlecontainer.css({"color": "#f2f2f2",
                                "text-shadow": "#262626 2px 2px 4px",
                                "font-size": "2em"})
      
      this.$title = this.$titlecontainer.find("h2");
      this.canvas = this.$canvas.get(0);

      this.reflow();

      this.smoothie = new SmoothieChart();
      this.smoothie.streamTo(this.canvas, this.delay);

      this.series = new TimeSeries();
      this.smoothie.addTimeSeries(this.series, {lineWidth: this.lineWidth || 2,
                                                strokeStyle: this.strokeStyle || "#FFF",
                                                fillStyle: this.fillStyle});
      
      if (this.query) {
        var reflowed = false;
        var me = this;
        this.sub = subs.subscribe(this.query, function(e) {
          var metric = format.float(e.metric);
          me.series.append(new Date(e.time).getTime(), metric);
          _.delay(function() {
            if (me.$title) {
              me.$title.text(me.title + ": " + metric);
            }
          }, +me.delay)

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
        query: this.query,
        strokeStyle: this.strokeStyle,
        lineWidth: this.lineWidth,
        fillStyle: this.fillStyle
      });
    }

    TimeSeriesView.prototype.editForm = function() {
      return Mustache.render('<label for="title">Title</label>' +
          '<input type="text" name="title" value="{{title}}" /><br />' +
          '<label for="query">Query</label>' +
          '<input type="text" name="query" value="{{query}}" /><br />' +
          '<label for="strokeStyle">StrokeStyle</label>' +
          '<input type="text" name="strokeStyle" value="{{strokeStyle}}" /><br />' +
          '<label for="lineWidth">LineWidth</label>' +
          '<input type="text" name="lineWidth" value="{{lineWidth}}" /><br />' +
          '<label for="fillStyle">FillStyle</label>' +
          '<input type="text" name="fillStyle" value="{{fillStyle}}" /><br />' +
          '<label for="delay">Delay</label>' +
          '<input type="text" name="delay" value="{{delay}}" />',
        this)
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

