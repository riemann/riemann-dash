# Serve HTTP traffic on this port
set  :port, 4567

riemann_base = '.'
riemann_src = "${riemann_base}/lib/riemann/dash"

# Add custom controllers in controller/
config[:controllers] = ["#{riemann_src}/controller"]

# Use the local view directory instead of the default
config[:views] = "#{riemann_src}/views"

# Specify a custom path to your workspace config.json
config[:ws_config] = "#{riemann_base}/config/config.json'

# Serve static files from this directory
config[:public] = "#{riemann_src}/public"
