var toolbar = (function() {
  // Build UI
  var toolbar = $('#toolbar');
  var form = $('<form/>');
  toolbar.append(form);
 
  var server = $('<input class="server" type="text" name="text">');
  var pager = $('<ol class="pager">');
  form.append(server);
  form.append(pager);
  form.submit(function(e) { 
    return false;
  });

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

  var onWorkspaceChange = function(callback) {
    onWorkspaceChangeCallbacks.push(callback);
  };

  // Set workspaces.
  var workspaces = function(workspaces) {
    pager.empty();
    var tile;
   
    workspaces.forEach(function(workspace) {
      tile = $('<li/>');
      tile.text(workspace.name);
      tile.click(function() {
        var targetWorkspace = $(this).text();
        onWorkspaceChangeCallbacks.forEach(function(f) {
          f(targetWorkspace);
        });
      });
      pager.append(tile);
    });
  };

  // Focus a workspace.
  var workspace = function(name) {
    pager.children().removeClass('current');
    pager.children().each(function(i, el) {
      if ($(el).text() === name) {
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
    workspaces: workspaces,
    workspace: workspace
  }
})();
