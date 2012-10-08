dash = (function() {
  var defaultWorkspace = {
    name: "Riemann",
    view: {
      type: 'Fullscreen',
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

  var currentWorkspaceName;
  var workspaces = [];
  var currentView;

  // Handle resizes.
  $(window).resize(function() {
    if (currentView) {
      currentView.reflow();
      try {
        view.focused().refocus();
      } catch (e) { }
    }
  });

  // Preserve current workspace state
  var stash = function() {
    var currentIndex = workspaceIndex(currentWorkspaceName);
    if (currentIndex != null) {
      workspaces[currentIndex] = 
        {name: currentWorkspaceName,
         view: currentView.json()
       };
    }
  }

  // Find a workspace's position by name.
  var workspaceIndex = function(name) {
    for (var i = 0; i < workspaces.length; i++) {
      if (workspaces[i].name == name) {
        return i;
      }
    }
    return null;
  }

  // Find a workspace by name.
  var workspace = function(name) {
    return workspaces[workspaceIndex(name)];
  }

  // Switch between workspaces.
  var switchWorkspace = function(workspace) {
    toolbar.workspace(workspace.name);
    
    stash();
    view.unfocus();

    if (currentView) {
      // Kill current view
      currentView.delete();
    }

    // Create new view
    currentWorkspaceName = workspace.name;
    currentView = view.reify(
      $.extend({container: $('#view')}, workspace.view));
    currentView.reflow();
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
        toolbar.workspaces(workspaces);
      }
  
      // Ensure there's a default workspace.
      if (workspaces.length === 0) {
        workspaces = [defaultWorkspace];
      }

      // Don't preserve current state.
      replacement = workspace(currentWorkspaceName);
      currentWorkspaceName = null;
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
  keys.bind(83, save);   // s
  keys.bind(82, reload); // r
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
    switchWorkspace(workspace(currentWorkspaceName));
  });

  // Handle toolbar workspace switching.
  toolbar.onWorkspaceChange(function(name) {
    switchWorkspace(workspace(name));
  });
  
  return {
    workspaces: function() { return workspaces },
    currentWorkspaceName: function() { return currentWorkspaceName },
    workspace: workspace,
    workspaceIndex: workspaceIndex,
    switchWorkspace: switchWorkspace,
    reload: reload,
    save: save
  }
})();
