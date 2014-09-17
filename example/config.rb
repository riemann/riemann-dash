# Example configuration file for riemann-dash.

# Serve HTTP traffic on this port
set  :port, 4567

# Answer queries sent to this IP address
set  :bind, "0.0.0.0"

riemann_base = '.'
riemann_src = "#{riemann_base}/lib/riemann/dash"

# Add custom controllers in controller/
config.store[:controllers] = ["#{riemann_src}/controller"]

# Use the local view directory instead of the default
config.store[:views] = "#{riemann_src}/views"

# Specify a custom path to your workspace config.json
config.store[:ws_config] = "#{riemann_base}/config/config.json"

# Serve static files from this directory
config.store[:public] = "#{riemann_src}/public"

# Save workspace configuration to Amazon S3 (you'll need to have the "fog"
# gem installed)
# config.store[:ws_config] = 's3://my-bucket/config.json'
# config.store[:s3_config] = {:aws_access_key_id => "123ABC", :aws_secret_access_key => "789XYZ"}
