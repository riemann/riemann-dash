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
  
  // Initialize keybindings
  function setKeyBindings() {
    var focusedBindings = {
      // left
      37: function(ev) { 
        if (ev.ctrlKey === true) {
          focused.split('HStack', -1);
        } else {
          focused.moveHorizontal(-1);
        }
      },

      // up
      38: function(ev) {
        if (ev.ctrlKey === true) {
          focused.split('VStack', -1);
        } else {
          focused.moveVertical(-1);
        }
      }, 
      
      // right
      39: function(ev) {
       if (ev.ctrlKey === true) {
         focused.split('HStack', 1);
       } else {
         focused.moveHorizontal(1);
       }
      }, 
      
      // down
      40: function(ev) { 
        if (ev.ctrlKey === true) {
          focused.split('VStack', 1);
        } else {
          focused.moveVertical(1);
        }
      },
      
      46: function() { focused.delete() },            // delete

      86: function() { focused.split('VStack', 1) },  // v
      87: function() { focused.split('HStack', 1) }   // h
    };

    var bindings = {};

    $(document).bind('keydown', function(ev) {
      if (focused) {
        var f = focusedBindings[ev.which];
      } else {
        var f = bindings[ev.which];
      }
      if (f) { f(ev) };
    });
  }
  setKeyBindings()


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
    if (w !== undefined) {
      return this.el.width(w);
    } else {
      return this.el.width();
    }
  };

  View.prototype.height = function(h) {
    if (h !== undefined) {
      return this.el.height(h);
    } else {
      return this.el.height();
    }
  };

  View.prototype.top = function(t) {
    if(t !== undefined) {
      return this.el.css("top", t);
    } else {
      return this.el.css("top");
    }
  };

  View.prototype.left = function(l) {
    if (l !== undefined) {
      return this.el.css("left", l);
    } else {
      return this.el.css("left");
    }
  };

  View.prototype.reflow = function() {
  };

  // Unfocus this view and delete it permanently.
  View.prototype.delete = function() {
    this.unfocus();
    var p = this.parent;
    if (p){
      if (p.removeChild) {
        p.removeChild(this);
      }
      p.reflow();
    }
    this.el.remove();
    this.el = null;
  }

  // Remove us from our parent, and have them reflow.
  View.prototype.removeFromParent = function() {
    this.unfocus();
    var oldParent = this.parent;
    if (oldParent && oldParent.removeChild) {
      oldParent.removeChild(this);
      oldParent.reflow();
    }
  }

  // Split in a parent stack that already exists. i is either -1 (place the
  // new view before us) or +1 (place the new view after us).
  View.prototype.splitParentStack = function(i) {
    console.log("Split parent");
    if (i === null) { i = 0 } 
    var index = this.parent.indexOf(this) - Math.min(i, 0);
    console.log(this.parent.indexOf(this), index);
    this.parent.insertChild(
      index,
      reify({type: 'View'})
    );
    this.parent.reflow();
    this.refocus();
  }

  // Split into a stackType. i is either -1 (place the new view before us) or
  // +1 (place the new view after us.
  View.prototype.split = function(stackType, i) {
    var parent = this.parent;
    if (parent) {
      if (parent.type === stackType) {
        this.splitParentStack(i);
      } else if (parent.replaceChild) {
        // Replace self with stack
        var stack = reify({
          type: stackType,
          weight: this.weight
        });
        parent.replaceChild(this, stack);
        
        // Add self to stack
        this.weight = 1;
        if (i === -1) {
          stack.addChild(this);
          stack.addChild(new View({type: 'View'}));
        } else {
          stack.addChild(new View({type: 'View'}));
          stack.addChild(this);
        }

        // Redraw
        parent.reflow();
        this.refocus();
      } else {
        console.log("Can't split: parent can't replace child.");
      }
    } else {
      console.log("Can't split: no parent");
    }
  }

  // Redraw the focus indicator
  View.prototype.refocus = function() {
    focusOverlay.width(this.el.width() - 10);
    focusOverlay.height(this.el.height() - 10);
    focusOverlay.css('top', this.el.offset().top + 5);
    focusOverlay.css('left', this.el.offset().left + 5);
    focusOverlay.show();
  }

  // Focus this view
  View.prototype.focus = function() {
    if (focused !== null) {
      focused.unfocus();
    }
    this.el.addClass("focused");
    this.refocus();
    focused = this;
  }

  // Unfocus this view
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
        return {
          i: this.parent.indexOf(this),
          stack: this.parent
        };
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
        return {
          i: this.parent.indexOf(this),
          stack: this.parent
        };
      } else {
        return this.parent.enclosingVStack();
      }
    } catch(e) {
      return null;
    }
  }

  // Move a view horizontally, by delta -1 = left, +1 = right).
  View.prototype.move = function(parentFinder, delta) {
    var enclosing = this[parentFinder]();

    if (enclosing) {
      // Get the stack we'll move in to, and our (possibly our parent's) index
      // in it.
      var stack = enclosing.stack;
      var i = enclosing.i;
      console.log("I am", this);
      console.log("Enclosing is", stack, i);

      var newI = i + delta;
      if (newI < 0) {
        console.log("Sorry, at start.");
        newI = 0;
      } else if (newI >= stack.children.length) {
        console.log("Sorry, at end.");
        newI = stack.children.length;
      } else {
        // What's there now?
        var neighbor = stack.children[newI];
        if (neighbor && neighbor.addChild) {
          // We can enter our neighbor
          this.removeFromParent();
          neighbor.addChild(this);
          neighbor.reflow();
          this.focus();
          return;
        }
      }

      if (this.parent === stack &&
        stack.children.length === 1) {
          // An special case: we can't leave our parent and then re-enter it,
          // because removeFromParent() would *destroy* our parent after we
          // left. Nothing *needs* to happen, so we return immediately.
        return;
      }
      
      // We're moving to a new position inside the enclosing stack.
      this.removeFromParent();
      stack.insertChild(newI, this);
      stack.reflow();
      this.focus();
    } else {
      console.log("Sorry, not yet");
    }
  }
  
  View.prototype.moveHorizontal = function(delta) {
    this.move('enclosingHStack', delta);
  }

  View.prototype.moveVertical = function(delta) {
    this.move('enclosingVStack', delta);
  }

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

  Balloon.prototype.replaceChild = function(v1, v2) {
    this.child.parent = null;
    this.child.el.detach();
    this.child = v2;
    this.el.append(this.child.el);
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
    if (json.children !== undefined) {
      json.children.map(reify).forEach(function(c) {
        self.addChild(c);
      });
    }
  };
  inherit(View, Stack);

  Stack.prototype.addChild = function(view) {
    view.parent = this;
    this.children.push(view);
    this.el.append(view.el);
  }

  Stack.prototype.insertChild = function(i, view) {
    view.parent = this;
    this.children.splice(i, 0, view);
    this.el.append(view.el);
  }

  // Replace v1 with v2
  Stack.prototype.replaceChild = function(v1, v2) {
    v1.parent = null;
    v1.el.detach();
    var i = this.children.indexOf(v1);
    this.children[i] = v2;
    this.el.append(v2.el);
  }

  Stack.prototype.removeChild = function(view) {
    view.parent = null;
    var i = this.children.indexOf(view);
    view.el.detach();
    this.children.splice(i, 1);

    // Delete self if empty
    if (this.children.length === 0) {
      this.delete();
    }
  }

  Stack.prototype.indexOf = function(child) {
    return this.children.indexOf(child);
  }

  Stack.prototype.delete = function() {
    this.children.forEach(function(c) {
      c.delete();
    });
    View.prototype.delete.call(this);
  }

  // HStack //////////////////////////////////////////////////////////////////

  var HStack = function(json) {
    Stack.call(this, json);
  };
  inherit(Stack, HStack);
  types.HStack = HStack;

  HStack.prototype.isHStack = true;

  HStack.prototype.reflow = function() {
    if (this.el === null) {
      // We're gone.
      return;
    }

    var width = this.width();
    var height = this.height();
    var left = 0;
    var weightSum = this.children.reduce(function(acc, c) {
      return acc + c.weight;
    }, 0);

    this.children.forEach(function(c) {
      c.height(height);
      c.width(width * (c.weight / weightSum));
      c.top(0);
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
    if (this.el === null) {
      // We're gone.
      return;
    }

    var width = this.width();
    var height = this.height();
    var top = 0;
    var weightSum = this.children.reduce(function(acc, c) {
      return acc + c.weight;
    }, 0);

    this.children.forEach(function(c) {
      c.width(width);
      c.height(height * (c.weight / weightSum));
      c.left(0);
      c.top(top);
      top = top + c.height();
      c.reflow();
    });
  };

  // Meh, not really a type but whatevs
  types.reify = reify;
  return types;
})();
