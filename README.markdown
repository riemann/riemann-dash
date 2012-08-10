Riemann-Dash
============

An extensible Sinatra dashboard for Riemann. Connects to Riemann over the
network and shows events matching the queries you configure.

Get started
==========

``` bash
gem install riemann-dash
riemann-dash
```

Riemann-dash will connect to a local Riemann server on port 5555, and display a
basic dashboard of all events in that server's index.

Configuring
===========

Riemann-dash takes an optional config file, which you can specify as the first
command-line argument. If none is given, it looks for a file in the local
directory: config.rb. That file can override any configuration options on the
Dash class (hence all Sinatra configuration) as well as the Riemann client
options, etc.

``` ruby
set :port, 6000 # HTTP server on port 6000
config[:client][:host] = 'my.ustate.server'
```

You'll probably want a more specific dashboard:

``` ruby
config[:views] = 'my/custom/view/directory'
```

Then you can write your own index.erb (and other views too, if you like). I've
provided an default stylesheet, layout, and dashboard in
lib/riemann/dash/views--as well as an extensive set of functions for laying out
events from a given query: see lib/riemann/dash/helper/renderer.rb.

A long history with cacti, nagios, and the like has convinced me that a.) web
configuration of dashboards is inevitably slower than just writing the code and
b.) you're almost certainly going to want to need more functions than I can
give you. My goal is to give you the tools to make it easier and get out of
your way.

An example config.rb, additional controllers, views, and public directory are
all in doc/dash. Should give you ideas for extending the dashboard for your own
needs.
