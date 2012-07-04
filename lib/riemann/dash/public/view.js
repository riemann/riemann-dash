var view = (function() {
  var types = {};

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

  // Balloon /////////////////////////////////////////////////////////////////

  var Balloon = function(json) {
    View.call(this, json);
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
    this.children = [];
    var self = this;
    json.children.map(reify).forEach(function(c) {
      self.addChild(c);
    });
  };
  inherit(View, Stack);

  Stack.prototype.addChild = function(view) {
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
