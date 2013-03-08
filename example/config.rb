set  :port, 5567

config = {
  # Serve HTTP traffic on this port

  # Add custom controllers in controller/
  :controllers => ['lib/riemann/dash/controller'],

  # Use the local view directory instead of the default
  :views => 'lib/riemann/dash/views',

  # Specify a custom path to your workspace config.json
  :ws_config => 'config/config.json',

  # Serve static files from this directory
  :public => 'lib/riemann/public'
}
