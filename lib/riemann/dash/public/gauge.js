(function() {
    var fitopts = {min: 6, max: 400};

    var Gauge = function(json) {
      view.View.call(this, json);
      this.query = json.query;
      this.title = json.title;
      this.clickFocusable = true;
      this.el.addClass("gauge");
      this.el.append(
        '<div class="quickfit metric value">?</div>' +
        '<div class="quickfit title"></div>'
      );

      this.el.find('.title').text(this.title);

      if (this.query) {
        var reflowed = false;
        var me = this;
        var value = this.el.find('.value');
        this.sub = subs.subscribe(this.query, function(e) {
          value.text(format.float(e.metric));
          value.attr('title', e.description);

          // The first time, do a full-height reflow.
          if (reflowed) {
            value.quickfit(fitopts);
          } else {
            me.reflow();
            reflowed = true;
          }
        });
      }
    }

    view.inherit(view.View, Gauge);
    view.Gauge = Gauge;
    view.types.Gauge = Gauge;

    Gauge.prototype.json = function() {
      return {
        type: 'Gauge',
        title: this.title,
        query: this.query
      }
    }

    Gauge.prototype.editForm = function() {
      return Mustache.render('<label for="title">Title</label>' +
          '<input type="text" name="title" value="{{title}}" /><br />' +
          '<label for="query">Query</label>' +
          '<input type="text" name="query" value="{{query}}" />',
        this)
    }

    Gauge.prototype.reflow = function() {
      // Size metric
      var value = this.el.find('.value');
      value.height("80%");
      value.quickfit({min: 6, max: 400, font_height_scale: 1});
      value.height(parseInt(value.css('font-size')));

      // Size title
      var title = this.el.find('.title');
      title.height(this.height() - value.height());
      title.quickfit(fitopts);
    }

    Gauge.prototype.delete = function() {
      if (this.sub) {
        this.sub.close();
      }
      view.View.prototype.delete.call(this);
    }
})();
