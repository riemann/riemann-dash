var subs = (function() {
  var server = "127.0.0.1:5556";
  var active = true;

  var load1 = profile.load(1000);
  var load5 = profile.load(5000);

  // Loads index with query, calling f with each received event.
  var subscribe = function(query, f) {
    var queryString = "query=" + encodeURI(query);
    var uri = "ws://" + server + "/index?subscribe=true&" + queryString;
    var ws = new WebSocket(uri);
    var $ws = $(ws);

    $ws.bind('open', function() {
      console.log("connected", query);
    });

    $ws.bind('close', function() {
      console.log("closed", query);
    });

    $ws.bind('message', function(e) {
      t1 = Date.now();
      if (active) {
        f(JSON.parse(e.originalEvent.data));
      }
      load1(t1, Date.now());
      load5(t1, Date.now());
    });

    $(window).unload(function() { ws.close; ws = null });
    return ws;
  }

  return {
    subscribe: subscribe,
    load1:   load1,
    load5:   load5,
    enable:  function() { active = true; console.log("Subs enabled."); },
    disable: function() { active = false; console.log("Subs disabled."); },
    toggle:  function() {
      active = ! active;
      if (active) { 
        console.log("Subs enabled.");
      } else {
        console.log("Subs disabled.");
      }
    },
    server:  function(s) {
      if (s === undefined) {
        return server;
      } else {
        server = s;
        return s;
      }
    }
  };
})();
