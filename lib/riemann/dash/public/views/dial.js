(function() {
    var fitopts = {min: 6, max: 1000};

    var Dial = function(json) {
      // Init
      view.View.call(this, json);
      this.clickFocusable = true;

      // Config
      this.query = json.query;
      this.title = json.title;
      this.commaSeparateThousands = json.commaSeparateThousands;
      this.max = json.max;

      // State
      this.currentEvent = null;

      // Gauge.js options
      this.opts = {
        limitMax: true,
      };

      // HTML
      this.el.addClass('dial');
      this.el.append(
        '<div class="box">' +
          '<canvas id="quickfit metric canvas"></canvas>' +
          '<div class="quickfit metric value">?</div>' +
          '<h2 class="quickfit"></h2>' +
          '</div>'
      );

      this.box = this.el.find('.box');
      this.el.find('h2').text(this.title);

      // When clicked, display event
      var self = this;
      this.box.click(function() { eventPane.show(self.currentEvent) });

      if (this.query) {
        var reflowed = false;
        var me = this;
        var value = this.el.find('.value');
        var dial = this.el.find('canvas').gauge(me.opts);
        var max = null;

        if (me.max) {
          max = me.max
          dial.data('gauge').maxValue = max;
        }

        this.sub = subs.subscribe(this.query, function(e) {
          self.currentEvent = e;
          me.box.attr('class', 'box state ' + e.state);

          if (e.metric) {
            if (!me.max && e.metric > max) {
              // Update maximum to highest value encountered so far
              max = e.metric;
              dial.data('gauge').maxValue = max;
            }
            dial.data('gauge').set(e.metric);
          }
          value.text(format.float(e.metric, 2, me.commaSeparateThousands) +
                     "/" + format.float(max, 2, me.commaSeparateThousands));
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

    view.inherit(view.View, Dial);
    view.Dial = Dial;
    view.types.Dial = Dial;

    Dial.prototype.json = function() {
      return $.extend(view.View.prototype.json.call(this), {
        type: 'Dial',
        title: this.title,
        query: this.query,
        commaSeparateThousands: this.commaSeparateThousands,
        max: this.max
      });
    }

    var editTemplate = _.template(
        "<label for='title'>Title</label>" +
        "<input type='text' name='title' value='{{title}}' /><br />" +
        "<label for='query'>Query</label>" +
        '<textarea type="text" name="query" class="query">{{query}}</textarea>' +
        "<label for='commaSeparateThousands'>Comma Separate Thousands</label>" +
        "<input type='checkbox' name='commaSeparateThousands' {% if(commaSeparateThousands)  { %} checked='checked' {% } %} /><br />" +
        "<label for='max'>Maximum</label>" +
        "<input type='text' name='max' value=\"{{-max}}\" /><br />" );

    Dial.prototype.editForm = function() {
      return editTemplate(this);
    }

    Dial.prototype.reflow = function() {
      // Size metric
      var value = this.el.find('.value');
      value.quickfit({min: 6, max: 1000, font_height_scale: 1});

      // Size title
      var title = this.el.find('h2');
      title.quickfit(fitopts);

      // Size canvas, force 1/2 aspect ratio
      var canvas = this.el.find('canvas');
      height = Math.floor(canvas.parent().height() - 10);
      width = Math.floor(canvas.parent().width() - 10);
      if (width > (2 * height)) {
        h = height;
        w = 2 * height;
      } else {
        h = width / 2;
        w = width;
      }
      canvas.height(h);
      canvas.width(w);
      canvas.css({
        "margin-top": "-" + (h / 2) + "px",
        "margin-left": "-" + (w / 2) + "px"});
    }

    Dial.prototype.delete = function() {
      if (this.sub) {
        subs.unsubscribe(this.sub);
      }
      view.View.prototype.delete.call(this);
    }
})();
