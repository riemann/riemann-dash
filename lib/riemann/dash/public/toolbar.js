var toolbar = (function() {
  // Build UI
  var toolbar = $('#toolbar');
  var form = $('<form/>');
  toolbar.append(form);

  // Method to adjust the position of the view div
  var sizeAdjust = function() {
    $('#view').css('top', toolbar.height() + "px");
  };
  $( window ).resize(function() {
    sizeAdjust();
  });
 
  var pager = $('<div class="pager">');
  var load = $('<div class="load"><div class="bar load1" /><div class="bar load5" /><span title="1- and 5-second subscription manager load averages">Load</span></div>');
  var server = $('<input class="server" type="text" name="text">');
  var server_type = $('<div class="server"><label><input type="radio" id="ws" name="server_type" value="ws" checked>websockets</label><label><input type="radio" id="sse" name="server_type" value="sse">sse</label></div>');
  var server_type_selector = $("input[name=server_type]");
  var server_type_sse_selector = $("input#ws");
  var server_type_ws_selector = $("input#sse");
  form.append(pager);
  form.append(server_type);
  form.append(server);
  form.append(load);
  form.submit(function(e) { 
    return false;
  });

  // Load /////////////////////////////////////////////////////////////////////

  window.setInterval(function() {
    load.find('span').text("Load " + 
        format.float(subs.load1()) + ', ' +
        format.float(subs.load5()));
    load.find(".load1").animate({width: (subs.load1() * 100) + "%"}, 200);
    load.find(".load5").animate({width: (subs.load5() * 100) + "%"}, 1000);
  }, 1000);

  // Server ///////////////////////////////////////////////////////////////////

  // Callbacks
  var onServerChangeCallbacks = [];
  var onServerTypeChangeCallbacks = [];

  // React to server being set.
  var onServerChange = function(callback) {
    onServerChangeCallbacks.push(callback);
  }

  var onServerTypeChange = function(callback) {
    onServerTypeChangeCallbacks.push(callback);
  }

  // When server is set, call callbacks.
  server.change(function() {
    onServerChangeCallbacks.forEach(function(f) {
      f(server.val());
    });
    server.blur();
  });

  // When server_type is set, call callbacks.
  $('input#ws').change(function(e) {
    onServerTypeChangeCallbacks.forEach(function(f) {
      f($("input[name=server_type]:checked").val());
    });
    server.blur();
  });

  $('input#sse').change(function(e) {
    onServerTypeChangeCallbacks.forEach(function(f) {
      f($("input[name=server_type]:checked").val());
    });
    server.blur();
  });
  
  // Suppress keybindings
  server.focus(keys.disable);
  server.blur(keys.enable);

  // Pager ////////////////////////////////////////////////////////////////////

  var onWorkspaceChangeCallbacks = [];
  var onWorkspaceReorderCallbacks = [];
  var onWorkspaceSwitchCallbacks = [];
  var onWorkspaceAddCallbacks = [];
  var onWorkspaceDeleteCallbacks = [];
  var onWorkspaceChange = function(callback) {
    onWorkspaceChangeCallbacks.push(callback);
  };
  var onWorkspaceReorder = function(callback) {
    onWorkspaceReorderCallbacks.push(callback);
  }
  var onWorkspaceSwitch = function(callback) {
    onWorkspaceSwitchCallbacks.push(callback);
  }
  var onWorkspaceAdd = function(callback) {
    onWorkspaceAddCallbacks.push(callback);
  }
  var onWorkspaceDelete = function(callback) {
    onWorkspaceDeleteCallbacks.push(callback);
  }

  // Set workspaces.
  var workspaces = function(workspaces) {
    pager.empty();

    // Workspaces
    var workspaceList = $('<ol>');
    pager.append(workspaceList);

    workspaces.forEach(function(workspace) {
      workspaceList.append(workspaceTile(workspace));
    });

    // Reordering
    workspaceList.sortable({
        axis: "x",
        containment: pager,
        delay: 20,
        distance: 4,
        tolerance: "intersect",
        update: function() {
          console.log("hi");
          var ids = workspaceList.find('li').map(function() {
            return $(this).data('workspaceId');
          });
          console.log("New ids are: ", ids);
          onWorkspaceReorderCallbacks.forEach(function(f) {
            f(ids);
          });
        }
    });

    // New button
    var add = $('<div class="add button">+</div>');
    add.click(function() {
      onWorkspaceAddCallbacks.forEach(function(f) {
        f();
      });
    });

    pager.append(add);
    sizeAdjust();
  };

  // Returns a tile for a workspace.
  var workspaceTile = function(workspace) {
    var tile = $('<li class="button" />');
    tile.text(workspace.name);
    tile.data('workspaceId', workspace.id);
//    tile.disableTextSelect();

    // Switch to this workspace.
    tile.click(function() {
      if (! tile.hasClass("current")) {
        onWorkspaceSwitchCallbacks.forEach(function(f) {
        f(workspace);
        });
      }
    });

    // Edit this workspace name.
    tile.dblclick(function() {
      namer = workspaceNamer(workspace);
      keys.disable();
      tile.replaceWith(namer);
      namer.focus();
    });

    // Delete
    var del = $('<div class="delete">×</div>');
    del.click(function() {
      onWorkspaceDeleteCallbacks.forEach(function(f) {
        f(workspace);
      });
    });
    tile.append(del);

    return tile;
  }

  // A box to rename a workspace.
  var workspaceNamer = function(workspace) {
    var field = $('<input type="text" />');
    field.val(workspace.name);
   
    // Change the workspace, firing callbacks and replacing the pager tile. 
    var submit = function(w2) {
      onWorkspaceChangeCallbacks.forEach(function(f) {
        f(workspace, w2);
      });

      keys.enable();
    }

    // When the input changes, change the workspace.
    field.change(function() {
      var newWorkspace = _.clone(workspace);
      newWorkspace.name = field.val();
      submit(newWorkspace);
    });

    // When we leave focus, revert.
    field.blur(function() { submit(workspace) });
    field.keydown(function(e) {
      if (e.which === 13) {
        field.change();
      } else if (e.which === 27) {
        submit(workspace);
      }
    });

    return field;
  }

  // Focus a workspace.
  var workspace = function(workspace) {
    console.log("Switching to workspace", workspace);
    pager.find('li').removeClass('current');
    if (workspace === null) {
      return;
    }

    pager.find('li').each(function(i, el) {
      if ($(el).data('workspaceId') === workspace.id) {
        $(el).addClass('current');
      }
    });
  }

  return {
    server: function(s) {
      if (s === undefined) {
        return server.val();
      } else {
        server.val(s);
        return s;
      }
    },
    server_type: function(s) {
      if (s === undefined) {
        return $("input[name=server_type]:checked").val();
      } else {
        console.log("handling server_type: " + s);
	if (s == "sse") {
          $("input[name=server_type]#sse").attr("checked",true);
        } else if (s == "ws") {
          $("input[name=server_type]#ws").attr("checked",true);
        }
        return s;
      }
    },
      
    onServerChange: onServerChange,
    onServerTypeChange: onServerTypeChange,
    onWorkspaceChange: onWorkspaceChange,
    onWorkspaceReorder: onWorkspaceReorder,
    onWorkspaceSwitch: onWorkspaceSwitch,
    onWorkspaceAdd:    onWorkspaceAdd,
    onWorkspaceDelete: onWorkspaceDelete,
    workspaces: workspaces,
    workspace: workspace
  }
})();
