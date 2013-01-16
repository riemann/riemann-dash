(function() {
    var fitopts = {min: 6, max: 1000};

    var Gauge = function(json) {
      view.View.call(this, json);
      this.query = json.query;
      this.title = json.title;
      this.clickFocusable = true;
      this.el.addClass('gauge');
      this.el.append(
        '<div class="box">' +
          '<div class="quickfit metric value">?</div>' +
          '<h2 class="quickfit"></div>' +
          '</div>'
      );

      this.box = this.el.find('.box');
      this.el.find('h2').text(this.title);

      if (this.query) {
        var reflowed = false;
        var me = this;
        var value = this.el.find('.value');
        this.sub = subs.subscribe(this.query, function(e) {
          me.box.attr('class', 'box state ' + e.state);
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
      return $.extend(view.View.prototype.json.call(this), {
        type: 'Gauge',
        title: this.title,
        query: this.query
      });
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
      value.quickfit({min: 6, max: 1000, font_height_scale: 1});

      // Size title
      var title = this.el.find('h2');
      title.quickfit(fitopts);
    }

    Gauge.prototype.delete = function() {
      if (this.sub) {
        subs.unsubscribe(this.sub);
      }
      view.View.prototype.delete.call(this);
    }
})();
