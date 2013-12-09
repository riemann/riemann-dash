var subs = (function() {

  // What server shall we connect to by default?
  var server;

  // What type of connection should we emit ?
  var server_type;

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
    return sub.close();
  }

  // Closes a subscription and deletes it from the subscription manager.
  var unsubscribe = function(sub) {
    clock.unsubscribe(sub.clockSub);
    delete subs[sub.id];
    return sub.close();
  }

  // Unsubscribe from all subscriptions.
  var unsubscribeAll = function() {
    _.each(subs, unsubscribe);
  }

  // Open a subscription's websocket channel.
  var open = function(sub) {
    return sub.open();
  }

  // Emit an expired event if oldest item from prioqueue is in the past.
  var expire = function(sub, now) {
    prioqueue = subs[sub.id].prioqueue;
    if (prioqueue) {
      bottom = prioqueue.bottomPriority();
      if (bottom) {
        expiry = new Date(bottom);
        if (expiry < now) {
          expired = prioqueue.shift();
          expired.state = 'expired';
          sub.f(expired);
        }
      }
    }
  }

  var Subscription = Backbone.Model.extend({

    initialize: function(id, query, f) {
      this.id = id;
      this.query = query;
      this.f = f;
      this.prioqueue = new PriorityQueue();
      this.clockSub = false;
    },

    isOpen: function() {
      if (server_type == "ws") {
        return this.ws && (this.ws.readyState != EventSource.CLOSED)
      } else {
        return this.ws && (this.ws.readyState != WebSocket.CLOSED)
      }
    },
    isClosed: function() { return !this.isOpen() },

    url: function() {
      var queryString = "query=" + encodeURIComponent(this.query);
      var loc = window.location, ws_uri;

      if (server_type == "sse") {
        return loc.protocol + "//" + server + "/index?" + queryString;
      } else {
        ws_uri = (loc.protocol == "https:") ? "wss://" : "ws://";
        return ws_uri + server + "/index?subscribe=true&" + queryString;
      }
    },

    open: function() {
      if (this.isOpen()) return this;
	console.log("will open url: " + this.url());

      var ws;
      if (server_type == "sse") {
        ws = this.ws = new EventSource(this.url());
      } else {
        ws = this.ws = new WebSocket(this.url());
      }

      ws.onopen = _.bind(function() {
        console.log("Socket opened", this.query);
      }, this);

      ws.onclose = _.bind(function(e) {
        console.log("Socket closed", this.query);
        this.ws = null;
      }, this);

      ws.onerror = _.bind(function(e) {
        console.log("Socket error", this.query);
        errorQueue.push(e);
        this.close();
      }, this);

      ws.onmessage = _.bind(function(e) {
        t1 = Date.now();
        if (active) {
          var event = JSON.parse(e.data);
          event.time = Date.parse(event.time);
          clock.advance(event.time);
          if (event.ttl > 0) { // only expired events have no TTL
            this.prioqueue.update(
              {host: event.host, service: event.service},
              event.time + (event.ttl * 1000) // convert TTL to ms
            );
          }
          this.f(event);
        }
        var t2 = Date.now();
        load1(t1, t2);
        load5(t1, t2);
      }, this);

      return this;

    },

    close: function() {
      if (this.ws) {
        this.ws.close();
        this.ws = void 0;
      }
      return this;
    }
  });

  // Add a subscription. Returns a subscription object. Subscriptions are
  // opened immediately.
  var subscribe = function(query, f) {
    var sub = new Subscription(newId(), query, f).open();
    subs[sub.id] = sub;

    sub.clockSub = clock.subscribe(function(now) {
      expire(sub, now);
    });

    return sub;
  }

  // Reconnect all inactive subs.
  var converge = function() {
    var closed = _.filter(subs, function(sub) {
      return sub.isClosed();
    });
    if (_.isEmpty(closed)) {
      // Done here.
      return;
    }
  
    // Display reconnection notice
    toastr.warning(_.size(closed) + " lost connections&mdash;check the server field above.");

    // Reopen
    _.each(closed, function(sub) {
      open(sub);
    });
  }

  var notifyErrors = function() {
    if (errorQueue.length == 0) {
      return;
    }
    toastr.warning(errorQueue.length + " socket errors");
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
    },
    server_type: function(s) {
      if (s === undefined) {
        return server_type;
      } else {
        server_type = s;
        return s;
      }
    }
  };
})();
