(function() {
    // Reify a log view from JSON
    var LogView = function(json) {
      // Extract state from JSON
      view.View.call(this, json);
      this.query = json.query;
      this.title = json.title;
      this.lines = json.lines || 1000;

      var self = this;

      // Set up HTML
      this.el.addClass('log');
      this.el.append('<h2></h2>' +
        '<div class="scroll"><table><thead><tr>' +
        '<th>host</th>' +
        '<th>service</th>' +
        '<th>state</th>' +
        '<th>metric</th>' +
        '<th>description</th>' +
        '</tr></thead><tbody></tbody></table></div>');
      this.el.find('h2').text(this.title);
      this.scroll = this.el.find('.scroll');
      this.log = this.el.find('tbody');

      // Line template
      this.lineTemplate = _.template("<tr><td>{{-host}}</td><td>{{-service}}</td><td>{{-state}}</td><td>{{-metric}}</td><td>{{-description}}</td></tr>");

      // When scrolling occurs, toggle tracking state.
      this.scroll.scroll(function(e) {
        if (self.scroll.scrollTop() >
             (self.log.height() - self.scroll.height())) {
          tracking = true;
        } else {
          tracking = false;
        }
      });

      // Are we currently following the bottom of the log?
      this.tracking = true;

      // This view can be clicked to focus on it.
      this.clickFocusable = true;

      if (this.query) {
        // Subscribe to our query
        this.sub = subs.subscribe(
            this.query,
            function(e) {
              self.update(e);
            }
        );
      }
    };

    // Set up our LogView class and register it with the view system
    view.inherit(view.View, LogView);
    view.Log = LogView;
    view.types.Log = LogView;

    // Scroll to bottom of log.
    LogView.prototype.scrollToBottom = function() {
      this.scroll.stop().animate({
        scrollTop: (this.log.height() - this.scroll.height() + 20)
      }, 1000, "swing");
    };

    // Are we at the bottom of the log?
    LogView.prototype.atBottom = function() {
      console.log(this.scroll.scrollTop());
      console.log(this.log.height() - this.scroll.height());
      return (this.scroll.scrollTop() >
          (this.log.height() - this.scroll.height()));
    };

    // Accept events from a subscription and update the log.
    LogView.prototype.update = function(event) {
      var defaults = {
        host: "",
        service: "",
        state: "",
        metric: "",
        description: ""
      }
      this.log.append(this.lineTemplate(_.defaults(event, defaults)));
      while (this.log[0].children.length > this.lines) {
          this.log[0].deleteRow(0);
      }
      if (this.tracking) { this.scrollToBottom(); };
    };

    // Serialize current state to JSON
    LogView.prototype.json = function() {
      return $.extend(view.View.prototype.json.call(this), {
        type: 'Log',
        title: this.title,
        query: this.query,
        lines: this.lines
      });
    };

    // HTML template used to edit this view
    var editTemplate = _.template(
      '<label for="title">title</label>' +
      '<input type="text" name="title" value="{{title}}" /><br />' +
      '<label for="query">query</label>' +
      '<textarea type="text" class="query" name="query">{{ query }}</textarea><br />' +
      '<label for="lines">Maximum lines (number of events)</label>' +
      '<input type="text" name="lines" value="{{lines}}" />'
    );

    // Returns the edit form
    LogView.prototype.editForm = function() {
      return editTemplate(this);
    };

    // Called when our parent needs to resize us
    LogView.prototype.reflow = function() {
    };

    // When the view is deleted, remove our subscription
    LogView.prototype.delete = function() {
      if (this.sub) {
        subs.unsubscribe(this.sub);
      }
      view.View.prototype.delete.call(this);
    };
})();

