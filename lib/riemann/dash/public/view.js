var view = (function() {
  var types = {};
  var focused = null;
  var focusOverlay = $('<div class="focusOverlay"></div>');
  $('body').append(focusOverlay);
  
  types.focused = function() {
    return focused;
  }

  function createObject(parent) {
    function TempClass() {}
    TempClass.prototype = parent;
    var child = new TempClass();
    return child;
  }

  function inherit(sup, sub) {
    var newSubPrototype = createObject(sup.prototype); 
    newSubPrototype.constructor = sub; 
    sub.prototype = newSubPrototype;
  }

  // Create *some* type of view from json
  var reify = function(json) {
    var t = types[json.type]
    return(new t(json));
  }

  // View ////////////////////////////////////////////////////////////////////

  var View = function(json) {
    this.type = json.type;
    this.el = $('<div class="view">');
    this.weight = json.weight || 1;
    this.el.css('background', 'rgb(' +
          Math.floor(Math.random() * 256) + ',' +
          Math.floor(Math.random() * 256) + ',' +
          Math.floor(Math.random() * 256) + ')');

    var self = this;
    this.clickFocusable = true;
    this.el.click(function() {
      if (self.clickFocusable) {
        self.focus();
      }
    });
  };
  types.View = View;

  View.prototype.width = function(w) {
    if (w) {
      return this.el.width(w);
    } else {
      return this.el.width();
    }
  };

  View.prototype.height = function(h) {
    if (h) {
      return this.el.height(h);
    } else {
      return this.el.height();
    }
  };

  View.prototype.top = function(t) {
    if(t) {
      return this.el.css("top", t);
    } else {
      return this.el.css("top");
    }
  };

  View.prototype.left = function(l) {
    if (l) {
      return this.el.css("left", l);
    } else {
      return this.el.css("left");
    }
  };

  View.prototype.detach = function() {
    el.detach();
  }

  View.prototype.delete = function() {
    el.remove();
    el = null;
  }
  
  View.prototype.reflow = function() {
  };

  View.prototype.focus = function() {
    if (focused !== null) {
      focused.unfocus();
    }
    this.el.addClass("focused");
    focusOverlay.width(this.el.width() - 10);
    focusOverlay.height(this.el.height() - 10);
    console.log(this.el.offset());
    focusOverlay.css('top', this.el.offset().top + 5);
    focusOverlay.css('left', this.el.offset().left + 5);
    focusOverlay.show();
    focused = this;
  }

  View.prototype.unfocus = function() {
    focusOverlay.hide();
    this.el.removeClass("focused");
    if (focused === this) {
      focused = null;
    }
  }

  // Returns the nearest parent hstack
  View.prototype.enclosingHStack = function() {
    try {
      if (this.parent.isHStack) {
        return this.parent;
      } else {
        return this.parent.enclosingHStack();
      }
    } catch(e) {
      return null;
    }
  }
  
  // Returns the nearest parent vstack
  View.prototype.enclosingVStack = function() {
    try {
      if (this.parent.isVStack) {
        return this.parent;
      } else {
        return this.parent.enclosingVStack();
      }
    } catch(e) {
      return null;
    }
  }

  // Returns the nearest parent hstack

  // Balloon /////////////////////////////////////////////////////////////////

  var Balloon = function(json) {
    View.call(this, json);
    this.clickFocusable = false;
    this.child = reify(json.child);
    this.el.append(this.child.el);
  }
  inherit(View, Balloon);
  types.Balloon = Balloon;

  Balloon.prototype.parent = function() {
    return this.el.parent();
  }

  Balloon.prototype.reflow = function() {
    var p = this.parent();
    this.width(p.width());
    this.height(p.height());
    this.child.width(p.width());
    this.child.height(p.height());
    this.child.reflow();
  }

  // Fullscreen //////////////////////////////////////////////////////////////

  var Fullscreen = function(json) {
    Balloon.call(this, json);
    this.el.detach();
    this.el.css('position', 'fixed');
    this.el.appendTo($('body'));
  }
  inherit(Balloon, Fullscreen);
  types.Fullscreen = Fullscreen;

  Fullscreen.prototype.parent = function() {
    return $(window);
  }

  // Stack ///////////////////////////////////////////////////////////////////

  var Stack = function(json) {
    View.call(this, json);
    this.clickFocusable = false;
    this.children = [];
    var self = this;
    json.children.map(reify).forEach(function(c) {
      self.addChild(c);
    });
  };
  inherit(View, Stack);

  Stack.prototype.addChild = function(view) {
    view.parent = this;
    this.children.push(view);
    this.el.append(view.el);
  }

  Stack.prototype.insertChild = function(i, view) {
    this.children.splice(i, 0, view);
    this.el.append(view.el);
  }

  Stack.prototype.deleteChild = function(i) {
    this.children[i].remove();
    this.children.delete(i)
  }

  Stack.prototype.delete = function() {
    children.each(function(c) {
      c.delete();
    });
    View.delete.call(this);
  }

  // HStack //////////////////////////////////////////////////////////////////

  var HStack = function(json) {
    Stack.call(this, json);
  };
  inherit(Stack, HStack);
  types.HStack = HStack;

  HStack.prototype.isHStack = true;

  HStack.prototype.reflow = function() {
    var width = this.width();
    var height = this.height();
    var left = 0;
    var weightSum = this.children.reduce(function(acc, c) {
      return acc + c.weight;
    }, 0);
    this.children.forEach(function(c) {
      c.height(height);
      c.width(width * (c.weight / weightSum));
      c.left(left);
      left = left + c.width();
      c.reflow();
    });
  }

  // VStack //////////////////////////////////////////////////////////////////

  var VStack = function(json) {
    Stack.call(this, json);
  };
  inherit(Stack, VStack);
  types.VStack = VStack;
  
  VStack.prototype.isVStack = true;
  
  VStack.prototype.reflow = function() {
    var height = this.height();
    var width = this.width();
    var top = 0;
    var weightSum = this.children.reduce(function(acc, c) {
      return acc + c.weight;
    }, 0);
    this.children.forEach(function(c) {
      c.width(width);
      c.height(height * (c.weight / weightSum));
      c.top(top);
      top = top + c.height();
      c.reflow();
    });
  }

  // Meh, not really a type but whatevs
  types.reify = reify;
  return types;
})();
