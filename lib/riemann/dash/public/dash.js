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
  var workspaceByProperty = function(property) {
    return function(match) {
      return _.find(workspaces, function(w) {
        return _.isEqual(match, w[property]);
      }) || null;
      // for some reason we can't return undefined and we must
      // explicitly return null upon failure
    };
  };

  var workspace = workspaceByProperty("id");
  var workspaceByName = workspaceByProperty("name");

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
      //console.log(util.merge(currentWorkspace(), {view: currentView.json()}));
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

  var getLocation = function() {
    return window.location.hash.slice(1);
  };

  var toLocation = function(workspace) {
    window.history.pushState(workspace, workspace.name, "#" + workspace.name);
  };

  var switchWorkspaceByName = function(name) {
    var workspace = workspaceByName(name) || workspaces[0];
    return switchWorkspace(workspace);
  };

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

    document.title = workspace.name;

    // update URL
    if (getLocation() !== workspace.name) {
      toLocation(workspace);
    }

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
      var server_type = config.server_type || "ws";
      subs.server(server);
      subs.server_type(server_type);
      toolbar.server(server);
      toolbar.server_type(server_type);

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

      var replacement = workspace(currentWorkspace.id);
      currentWorkspaceId = null;

      var currentLocation = getLocation()
      if (currentLocation) { // check URL first
        switchWorkspaceByName(currentLocation);
      } else if (replacement) { // otherwise use replacement
        switchWorkspace(replacement)
      } else { // failing that use the first
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
        server_type: toolbar.server_type(),
        workspaces: workspaces
      },
      function() { toastr.info("Configuration saved.") },
      function(xhr, msg) {
        console.log("Error saving config", msg);
        toastr.error("Error saving config: " + msg);
      }
    );
  }

  var showconfig = function() {
    stash();
    var configTemplate = _.template("<div>{{- config }}</div>");
    var rendered = configTemplate({config: JSON.stringify({
        server: toolbar.server(),
        server_type: toolbar.server_type(),
        workspaces: workspaces
    })});
    var dialog = $(rendered);
    dialog.modal({onClose: function() {
        keys.enable();
        $.modal.close();
    }});
 };

  var help = function() {
    var dialog = $(
      '<div><h1>Help</h1><ul>' +
      '<li><b>e</b>: edit the view</li>' +
      '<li><b>?</b>: display this help box</li>' +
      '<li><b>s</b>: save the dashboard</li>' +
      '<li><b>c</b>: display the current config</li>' +
      '<li><b>r</b>: reload the dashboard from last saved config</li>' +
      '<li><b>+</b>: increase the size of the view</li>' +
      '<li><b>-</b>: decrease the size of the view</li>' +
      '<li><b>v</b>: split the view vertically</li>' +
      '<li><b>h</b>: split the view horizontally</li>' +
      '<li><b>&#8592;</b>: left arrow move the view to the left</li>' +
      '<li><b>&#8594;</b>: right arrow move the view to the right</li>' +
      '<li><b>&#8593;</b>: up arrow move the view up</li>' +
      '<li><b>&#8595;</b>: down arrow move the view down</li>' +
      '<li><b>pageup</b>: select the parent of the current view</li>' +
      '<li><b>d</b>: delete a view</li>' +
      '<li><b>delete</b>: delete a view</li>' +
      '<li><b>alt-1, alt-2, etc</b>: switch to a different workplace</li>' +
      '<li><b>p</b>: pause/unpause the event stream(s)</li>' +
      '</ul></div>'
    );

    // keys.disable();
    dialog.modal({onClose: function() {
        keys.enable();
        $.modal.close();
    }});
  }

  // Global keybindings.
  keys.bind(80, subs.toggle); // p
  keys.bind(82, reload);      // r
  keys.bind(83, save);        // s
  keys.bind(67, showconfig);  // c
  keys.bind(191, help);       // ?
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

  toolbar.onServerTypeChange(function (server_type) {
    console.log("Server type changed to", server_type);
    subs.server_type(server_type);
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

  toolbar.onWorkspaceReorder(function(workspaceIds) {
    workspaces = _.map(workspaceIds, workspace);
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
