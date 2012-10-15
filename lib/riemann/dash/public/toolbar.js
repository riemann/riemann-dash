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
    load.find(".load1").css("width", (subs.load1() * 100) + "%");
    load.find(".load5").css("width", (subs.load5() * 100) + "%");
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
