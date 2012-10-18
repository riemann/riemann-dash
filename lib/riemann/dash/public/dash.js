dash = (function() {
  var defaultWorkspace = {
    name: "Riemann",
    view: {
      type: 'Balloon',
      child: {
        type: 'VStack',
        children: [
          {
            type: 'Title',
            title: "Riemann"
          },
          {
            type: 'Help',
          }
        ]
      }
    }
  };

  var currentWorkspaceId = null;
  var workspaces = [];
  var currentView;

  // Find a workspace's position.
  var workspaceIndex = function(workspace) {
    if (workspace === null || workspace === undefined) {
      return null;
    }

    for (var i = 0; i < workspaces.length; i++) {
      if (workspaces[i].id === workspace.id) {
        return i;
      }
    }
    return null;
  }

  // Find a workspace by ID.
  var workspace = function(id) {
    for (var i = 0; i < workspaces.length; i++) {
      if (workspaces[i].id === id) {
        return workspaces[i];
      }
    }
    return null;
  }

  // Get current workspace.
  var currentWorkspace = function() {
    return workspace(currentWorkspaceId);
  }

  var currentWorkspaceIndex = function() {
    return workspaceIndex({id: currentWorkspaceId});
  }

  // Preserve current workspace state
  var stash = function() {
    var currentIndex = currentWorkspaceIndex();
    if (currentIndex != null) {
      console.log(util.merge(currentWorkspace(), {view: currentView.json()}));
      workspaces[currentIndex] = 
        util.merge(currentWorkspace(), {view: currentView.json()});
    }
    toolbar.workspaces(workspaces);
    toolbar.workspace(currentWorkspace());
  }
  // Make a new workspace
  var newWorkspace = function() {
    var w = _.clone(defaultWorkspace);
    w.id = util.uniqueId();
    return w;
  }

  // Switch between workspaces.
  var switchWorkspace = function(workspace) {
    // Shut down current setup
    stash();
    view.unfocus();

    if (currentView) {
      currentView.delete();
    }

    // Switch
    currentWorkspaceId = workspace.id;
    toolbar.workspace(workspace);

    // Create new view
    currentView = view.reify(
      $.extend({container: $('#view')}, workspace.view));
    currentView.reflow();
  }

  // Delete a workspace.
  var deleteWorkspace = function(workspace) {
    console.log("Deleting", workspace);
    var index = currentWorkspaceIndex();
    console.log("at", index);
    workspaces = _.filter(workspaces, function(w) { return w.id !== workspace.id });
    console.log("New workspaces:", workspaces);
    toolbar.workspaces(workspaces);
    console.log("Switching to", workspaces[Math.max(index, workspaces.length - 1)]);
    switchWorkspace(workspaces[Math.min(index, workspaces.length - 1)]);
  }

  // Reload the dash.
  var reload = function() {
    persistence.load(function(config) {
      // Server
      var server = config.server || '127.0.0.1:5556';
      subs.server(server);
      toolbar.server(server);

      // Workspaces
      if (config.workspaces) {
        workspaces = config.workspaces;
        workspaces.forEach(function(w) {
          w.id = w.id || util.uniqueId();
        });
        toolbar.workspaces(workspaces);
      }
  
      // Ensure there's a default workspace.
      if (workspaces.length === 0) {
        workspaces = [defaultWorkspace];
      }

      // Don't preserve current state.
      var replacement = workspace(currentWorkspace.id);
      currentWorkspaceId = null;
      if (replacement) {
        // Load current workspace, if it's still there
        switchWorkspace(replacement);
      } else {
        // Or revert to the first workspace
        switchWorkspace(workspaces[0]);
      }
    });
  }

  // Save everything.
  var save = function() {
    stash();

    persistence.save(
      {
        server: toolbar.server(),
        workspaces: workspaces
      },
      function() { console.log("Saved config."); },
      function(xhr, x, msg) { console.log("Error saving config", msg); }
    );
  }

  // Global keybindings.
  // s is for save
  keys.bind(80, subs.toggle); // p
  keys.bind(82, reload);      // r
  keys.bind(83, save);        // s
  keys.bind(49, function(e) { e.altKey && switchWorkspace(workspaces[0]) });
  keys.bind(50, function(e) { e.altKey && switchWorkspace(workspaces[1]) });
  keys.bind(51, function(e) { e.altKey && switchWorkspace(workspaces[2]) });
  keys.bind(52, function(e) { e.altKey && switchWorkspace(workspaces[3]) });
  keys.bind(53, function(e) { e.altKey && switchWorkspace(workspaces[4]) });
  keys.bind(54, function(e) { e.altKey && switchWorkspace(workspaces[5]) });
  keys.bind(55, function(e) { e.altKey && switchWorkspace(workspaces[6]) });
  keys.bind(56, function(e) { e.altKey && switchWorkspace(workspaces[7]) });
  keys.bind(57, function(e) { e.altKey && switchWorkspace(workspaces[8]) });
  keys.bind(58, function(e) { e.altKey && switchWorkspace(workspaces[9]) });

  // Handle server changes from toolbar.
  toolbar.onServerChange(function(server) {
    console.log("Server changed to", server);
    // Notify subscription system
    subs.server(server);
    // Reload view.
    switchWorkspace(currentWorkspace());
  });

  // Handle toolbar workspace switching.
  toolbar.onWorkspaceSwitch(function(workspace) {
    switchWorkspace(workspace);
  });

  // Workspace *changes*.
  toolbar.onWorkspaceChange(function(w1, w2) {
    workspaces[workspaceIndex(w1)] = w2;
    toolbar.workspaces(workspaces);
    toolbar.workspace(currentWorkspace());
  });

  // Workspace additions.
  toolbar.onWorkspaceAdd(function() {
    w = newWorkspace();
    workspaces.push(w);
    toolbar.workspaces(workspaces);
    switchWorkspace(w);
  });

  // Workspace deletions
  toolbar.onWorkspaceDelete(function(w) {
    deleteWorkspace(w);
  });

  // Handle resizes.
  $(window).resize(function() {
    if (currentView) {
      currentView.reflow();
      try {
        view.focused().refocus();
      } catch (e) { }
    }
  });
  
  return {
    workspaces: function() { return workspaces },
    currentWorkspace: function() { return currentWorkspace },
    workspaceIndex: workspaceIndex,
    switchWorkspace: switchWorkspace,
    reload: reload,
    save: save
  }
})();
