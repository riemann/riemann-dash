(function() {
    var fitopts = {min: 6, max: 400};

    var Title = function(json) {
      view.View.call(this, json);
      this.title = json.title;
      this.clickFocusable = true;
      this.el.addClass("title");
      this.h2 = $('<h2/>');
      this.el.append(this.h2);
      this.h2.text(this.title);
      this.reflow();
    }

    view.inherit(view.View, Title);
    view.Title = Title;
    view.types.Title = Title;

    Title.prototype.json = function() {
      return $.extend(view.View.prototype.json.call(this), {
        type: 'Title',
        title: this.title
      });
    }

    var editTemplate = _.template(
      '<label for="title">Title</label>' +
      '<input type="title" name="title" value="{{title}}" />'
    );

    Title.prototype.editForm = function() {
      return editTemplate(this);
    }

    Title.prototype.reflow = function() {
      this.h2.quickfit(fitopts);
    }
})();
