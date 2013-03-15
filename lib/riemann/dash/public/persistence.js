// Provides persistent storage for dashboard configuration.
var persistence = (function() {
  // Saves configuration to persistent store. Calls success() or error() when 
  // complete.
  var save = function(config, success, error) {
    jQuery.ajax('config', {
      type: 'POST',
      success: success,
      error: error,
      contentType: 'application/json',
      data: JSON.stringify(config),
      dataType: 'json'
    });
  };

  // Returns configuration from persistent store.
  var load = function(success, error) {
    jQuery.ajax('config', {
        type: 'GET',
        success: success,
        error: error,
        dataType: 'json'
    });
  };

  return {
    save: save,
    load: load
  }
})();
