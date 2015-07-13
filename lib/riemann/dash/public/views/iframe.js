(function() {
    var iframe = function(json) {
      view.View.call(this, json);
      this.title = json.title;
      this.url = json.url;
      this.clickFocusable = true;
      this.el.addClass("iframe");
      this.h2 = $('<h2/>');
      this.el.append(this.h2);
      this.h2.text(this.title);
      this.iframe = $('<iframe />');
      this.iframe.addClass('container').addClass('quickfit');
      this.iframe.attr('src', this.url);
      this.el.append(this.iframe);
      this.reflow();
    }

    view.inherit(view.View, iframe);
    view.iframe = iframe;
    view.types.iframe = iframe;

    iframe.prototype.json = function() {
      return $.extend(view.View.prototype.json.call(this), {
        type: 'iframe',
        title: this.title,
        url: this.url
      });
    }

    var editTemplate = _.template(
      '<label for="title">Title</label>' +
      '<input type="title" name="title" value="{{title}}" /><br />' +
      '<label for="title">URL</label>' +
      '<input type="text" name="url" value="{{url}}" />'
    );

    iframe.prototype.editForm = function() {
      return editTemplate(this);
    }

    iframe.prototype.reflow = function() {
      this.iframe.height(this.el.innerHeight() - this.h2.height())
      this.iframe.width(this.width())
    }
})();
