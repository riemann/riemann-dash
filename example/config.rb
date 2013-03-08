# Serve HTTP traffic on this port
set  :port, 4567

riemann = 'lib/riemann/dash'

# Add custom controllers in controller/
config[:controllers] = ["#{riemann}/controller"]

# Use the local view directory instead of the default
config[:views] = "#{riemann}/views"

# Specify a custom path to your workspace config.json
config[:ws_config] = 'config/config.json'

# Serve static files from this directory
config[:public] = "#{riemann}/public"
