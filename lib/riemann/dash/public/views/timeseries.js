(function() {
    var fitopts = {min: 6, max: 1000};

    var TimeSeriesView = function(json) {
      view.View.call(this, json);
      this.query = json.query;
      this.title = json.title;
      this.clickFocusable = true;
      this.el.addClass('timeseries');
      this.el.append(
        '<div class="box">' +
          '<canvas class="timeseries"></canvas>' +
          '</div>'
      );

      this.$canvas = this.el.find(".timeseries");
      this.canvas = this.$canvas.get(0);
      this.smoothie = new SmoothieChart();
      this.smoothie.streamTo(this.canvas, 2000);

      this.series = new TimeSeries();
      this.smoothie.addTimeSeries(this.series, {lineWidth: 3});

      this.reflow();
      
      if (this.query) {
        var reflowed = false;
        var me = this;
        this.sub = subs.subscribe(this.query, function(e) {
          var metric = format.float(e.metric);
          me.series.append(new Date(e.time).getTime(), metric);
        });
      }
    }

    view.inherit(view.View, TimeSeriesView);
    view.TimeSeries = TimeSeriesView;
    view.types.TimeSeries = TimeSeriesView;
    console.log(view.types);
    console.log("Hello world!!!");

    TimeSeriesView.prototype.json = function() {
      return $.extend(view.View.prototype.json.call(this), {
        type: 'TimeSeries',
        title: this.title,
        query: this.query
      });
    }

    TimeSeriesView.prototype.editForm = function() {
      return Mustache.render('<label for="title">Title</label>' +
          '<input type="text" name="title" value="{{title}}" /><br />' +
          '<label for="query">Query</label>' +
          '<input type="text" name="query" value="{{query}}" />',
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

