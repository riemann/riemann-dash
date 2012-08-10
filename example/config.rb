# Serve HTTP traffic on this port
set :port, 5000

# Talk to this Riemann server
config[:client][:host] = '123.45.67.8'

# Add custom controllers in controller/
config[:controllers] << 'controller'

# Use the local view directory instead of the default
config[:views] = 'views'

# Serve static files from this directory
public_dir 'public'
