var subs = (function() {
  // Loads index with query, calling f with each received event.
  var subscribe = function(query, f) {
    var queryString = "query=" + encodeURI(query);
    var uri = "ws://127.0.0.1:5556/index?subscribe=true&" + queryString;
    var ws = new WebSocket(uri);
    var $ws = $(ws);

    $ws.bind('open', function() {
      console.log("connected", query);
    });

    $ws.bind('close', function() {
      console.log("closed", query);
    });

    $ws.bind('message', function(e) {
      f(JSON.parse(e.originalEvent.data));
    });

    $(window).unload(function() { ws.close; ws = null });
    return ws;
  }

  return {
    "subscribe": subscribe
  };
})();
