(function() {
    var List = function(json) {
      view.View.call(this, json);
      this.query = json.query;
      this.title = json.title;
      this.el.addClass('list');
      this.el.append(
              '<h2 class="quickfit"></h2>' +
              '<ul></ul>'
      );

      this.ul = this.el.find('ul');
      this.el.find('h2').text(this.title);

      this.events = {};

      if (this.query) {
        var me = this;
        this.sub = subs.subscribe(this.query, function(e) {
                me.update.call(me, e);
        });
      }
    }

    view.inherit(view.View, List);
    view.List = List;
    view.types.List = List;

    List.prototype.json = function() {
      return $.extend(view.View.prototype.json.call(this), {
        type: 'List',
        title: this.title,
        query: this.query
      });
    }

    var editTemplate = _.template(
        "<label for='title'>Title</label>" +
        "<input type='text' name='title' value='{{title}}' /><br />" +
        "<label for='query'>Query</label>" +
        '<textarea type="text" name="query" class="query">{{query}}</textarea>');

    List.prototype.editForm = function() {
      return editTemplate(this);
    }

    List.prototype.reflow = function() {
    }

    List.prototype.delete = function() {
      if (this.sub) {
        subs.unsubscribe(this.sub);
      }
      view.View.prototype.delete.call(this);
    }

    List.prototype.update = function(e) {
          var key = [e.host, e.service];
          if (e.state == "expired") {
                  delete this.events[key];
          } else {
                  this.events[key] = e;
          }
          this.ul.empty();
          for (var row in this.events) {
                  var e = this.events[row];
                  var li = $('<li>' + e.host + " " + e.service + '</li>');
                  li.attr('class', "state " + e.state);
                  li.attr('title', e.description);
                  this.ul.append(li);
          }
    }
})();
