var toolbar = (function() {
  // Build UI
  var toolbar = $('#toolbar');
  var form = $('<form/>');
  toolbar.append(form);
 
  var pager = $('<ol class="pager">');
  var load = $('<div class="load"><div class="bar load1" /><div class="bar load5" /><span title="1- and 5-second subscription manager load averages">Load</span></div>');
  var server = $('<input class="server" type="text" name="text">');
  form.append(pager);
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

  // React to server being set.
  var onServerChange = function(callback) {
    onServerChangeCallbacks.push(callback);
  }

  // When server is set, call callbacks.
  server.change(function() {
    onServerChangeCallbacks.forEach(function(f) {
      f(server.val());
    });
    server.blur();
  });
  
  // Suppress keybindings
  server.focus(keys.disable);
  server.blur(keys.enable);

  // Pager ////////////////////////////////////////////////////////////////////

  var onWorkspaceChangeCallbacks = [];
  var onWorkspaceSwitchCallbacks = [];
  var onWorkspaceAddCallbacks = [];
  var onWorkspaceDeleteCallbacks = [];
  var onWorkspaceChange = function(callback) {
    onWorkspaceChangeCallbacks.push(callback);
  };
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
    var tile;
   
    // Workspaces
    workspaces.forEach(function(workspace) {
      pager.append(workspaceTile(workspace));
    });

    // New button
    var add = $('<li>+</li>');
    add.click(function() {
      onWorkspaceAddCallbacks.forEach(function(f) {
        f();
      });
    });
    pager.append(add);
  };

  // Returns a tile for a workspace.
  var workspaceTile = function(workspace) {
    var tile = $('<li/>');
    tile.text(workspace.name);
    tile.data('workspaceId', workspace.id);
    tile.disableTextSelect();

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
    pager.children().removeClass('current');
    if (workspace === null) {
      return;
    }
    pager.children().each(function(i, el) {
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
    onServerChange: onServerChange,
    onWorkspaceChange: onWorkspaceChange,
    onWorkspaceSwitch: onWorkspaceSwitch,
    onWorkspaceAdd:    onWorkspaceAdd,
    onWorkspaceDelete: onWorkspaceDelete,
    workspaces: workspaces,
    workspace: workspace
  }
})();
