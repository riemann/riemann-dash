var subs = (function() {
  // What server shall we connect to by default?
  var server;

  // Subscription ID counter.
  var id_counter = -1;

  // Subscriptions
  var subs = {};
  
  // Switch to turn on/off event processing
  var active = true;
 
  // Error queue for notification
  var errorQueue = [];

  // Instrumentation
  var load1 = profile.load(1000);
  var load5 = profile.load(5000);

  // Get a new subscription ID.
  var newId = function() {
    return id_counter += 1;
  }

  // Close a subscription's websocket channel.
  var close = function(sub) {
    if (sub.ws == null) {
      return sub;
    }
    sub.ws.close();
    sub.ws == null;
    return sub;
  }

  // Closes a subscription and deletes it from the subscription manager.
  var unsubscribe = function(sub) {
    delete subs[sub.id];
    close(sub);
  }

  // Unsubscribe from all subscriptions.
  var unsubscribeAll = function() {
    _.each(subs, unsubscribe);
  }

  // Open a subscription's websocket channel.
  var open = function(sub) {
    if (sub.ws != null && sub.ws.readyState != WebSocket.CLOSED) {
      return sub;
    }

    var f = sub.f;
    var queryString = "query=" + encodeURI(sub.query);
    var uri = "ws://" + server + "/index?subscribe=true&" + queryString;
    sub.ws = new WebSocket(uri);
    var $ws = $(sub.ws);
    
    $ws.bind('open', function() {
      console.log("Socket opened", sub.query);
    });

    $ws.bind('close', function(e) {
      console.log("Socket closed", sub.query);
      sub.ws = null;
    });

    $ws.bind('error', function(e) {
      console.log("Socket error", sub.query);
      errorQueue.push(e);
      ws.close();
    });

    $ws.bind('message', function(e) {
      t1 = Date.now();
      if (active) {
        f(JSON.parse(e.originalEvent.data));
      }
      load1(t1, Date.now());
      load5(t1, Date.now());
    });

    return sub;
  }

  // Add a subscription. Returns a subscription object. Subscriptions are
  // opened immediately.
  var subscribe = function(query, f) {
    var sub = {
      id: newId(),
      query: query,
      f: f,
      ws: null
    }
    subs[sub.id] = sub;
    open(sub);
    return sub;
  }

  // Reconnect all inactive subs.
  var converge = function() {
    var closed = _.filter(subs, function(sub) {
      return (sub.ws == null || sub.ws.readyState == WebSocket.CLOSED);
    });
    if (_.isEmpty(closed)) {
      // Done here.
      return;
    }
  
    // Display reconnection notice
    toastr.warning(_.size(closed) + " lost connections");

    // Reopen
    _.each(closed, function(sub) {
      open(sub);
    });
  }

  var notifyErrors = function() {
    if (errorQueue.length == 0) {
      return;
    }
    _.warning(errorQueue.length + " socket errors");
    errorQueue.length = 0;
    converge();
  }

  // Periodically notify of errors.
  window.setInterval(notifyErrors, 100);

  // Periodically converge.
  setInterval(converge, 6000);

  // When terminating, close all connections.
  $(window).unload(unsubscribeAll);

  return {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    unsubscribeAll: unsubscribeAll,
    converge: converge,
    load1:   load1,
    load5:   load5,
    subs:    function() { return subs; },
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
