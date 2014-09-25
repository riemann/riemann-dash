# Example Rack handler.

# To run riemann-dash in a Rack-compatible web server such as nginx/apache
# with phusion passenger, you can use this rackup app. Refer to your Ruby
# application server's documentation to find out how to configure it to load
# this file.

# Uncomment the following line if you installed riemann-dash outside of ruby's
# load path (ruby -e 'puts $LOAD_PATH' to check).
#$LOAD_PATH.unshift('/path/to/riemann-dash/lib')

require 'riemann/dash'

Riemann::Dash::App.load '/path/to/config.rb'
run Riemann::Dash::App

