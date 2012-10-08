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
      if (config.workspaces) {
        workspaces = config.workspaces;
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
      {workspaces: workspaces},
      function() { console.log("Saved config."); },
      function(xhr, x, msg) { console.log("Error saving config", msg); }
    );
  }

  // Global keybindings.
  // s is for save
  keys.bind(83, save);
  keys.bind(82, reload);

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
