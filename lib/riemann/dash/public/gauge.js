(function() {
    var fitopts = {min: 6, max: 400};

    var Gauge = function(json) {
      view.View.call(this, json);
      this.query = json.query;
      this.label = json.label;
      this.clickFocusable = true;
      this.el.addClass("gauge");
      this.el.append(
        '<div class="quickfit metric value">?</div>' +
        '<div class="quickfit label"></div>'
      );

      this.el.find('.label').text(this.label);

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

    Gauge.prototype.reflow = function() {
      // Size metric
      var value = this.el.find('.value');
      value.height("80%");
      value.quickfit({min: 6, max: 400, font_height_scale: 1});
      value.height(parseInt(value.css('font-size')));

      // Size label
      var label = this.el.find('.label');
      label.height(this.height() - value.height());
      label.quickfit(fitopts);
    }

    Gauge.prototype.delete = function() {
      this.sub.close();
      view.View.prototype.delete.call(this);
    }
})();
