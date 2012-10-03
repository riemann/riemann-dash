(function() {
    var fitopts = {min: 6, max: 400};

    var Title = function(json) {
      view.View.call(this, json);
      this.text = json.text;
      this.clickFocusable = true;
      this.el.addClass("title");
      this.el.text(this.text);
      this.reflow();
    }

    view.inherit(view.View, Title);
    view.Title = Title;
    view.types.Title = Title;

    Title.prototype.json = function() {
      return {
        type: 'Title',
        text: this.text
      };
    }

    Title.prototype.reflow = function() {
      this.el.quickfit(fitopts);
    }
})();
