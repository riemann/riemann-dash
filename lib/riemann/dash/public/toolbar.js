var toolbar = (function() {
  // Build UI
  var toolbar = $('#toolbar');
  var form = $('<form/>');
  toolbar.append(form);
 
  var server = $('<input type="text" name="text">');
  var pager = $('<ol class="pager">');
  form.append(server);
  form.append(pager);
  form.submit(function(e) { 
    return false;
  });

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

  return {
    server: function(s) {
      if (s === undefined) {
        return server.val();
      } else {
        server.val(s);
        return s;
      }
    },
    onServerChange: onServerChange
  }
})();
