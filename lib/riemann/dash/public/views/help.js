(function() {
    var Help = function(json) {
      view.View.call(this, json);
      this.clickFocusable = true;
      this.el.addClass("help");
      this.el.append('<div class="box">' +
        "<p>Welcome to Riemann-Dash.</p>" +
        "<p>Need a refresher on the query language? See the <a href=\"https://github.com/aphyr/riemann/blob/master/test/riemann/query_test.clj\">query tests</a> for examples, or read the <a href=\"https://github.com/aphyr/riemann/blob/master/src/riemann/Query.g\">spec</a>.</p>" +
        "<p>Click to select a view. Escape unfocuses. Use the arrow keys to move a view. Use Control+arrow to <i>split</i> a view in the given direction.</p>" +
        "<p>To edit a view, hit e. Use enter, or click 'apply', to apply your changes. Escape cancels.</p>" +
        "<p>To save your changes to the server, press s. You can refresh the page, or press r to reload.</p>" +
        "<p>Make views bigger and smaller with the +/- keys. Pageup selects the parent of the current view. To delete a view, use the delete key.</p>" +
        "<p>Switch between workspaces with alt-1, alt-2, etc.</p>" +
        "<p>View is an empty space. Title is an editable text title. Fullscreen and Balloon are top-level container views; you probably won't use them. HStack and VStack are the horizontal and vertical container views; they're implicitly created by splits, but you can create them yourself for fine control. Gauge shows a single event. Grid shows a table of events. Timeseries and Flot show metrics over time--Timeseries is deprecated; Flot will probably replace it.</p>" +
        "<p>My sincere apologies for layout jankiness. There are a few gross bugs and incapabilities in the current hstack/vstack system; if things get really bad, you can always edit ws/config.json on the server. The control scheme will probably change; I appreciate your ideas and patches.</p>" +
        '</div>'
    );
    }

    view.inherit(view.View, Help);
    view.Help = Help;
    view.types.Help = Help;

    Help.prototype.json = function() {
      return {
        type: 'Help',
        title: this.title
      };
    }
})();
