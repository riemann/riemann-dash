Riemann-Dash
============

A javascript, websockets-powered dashboard for Riemann.

Get started
==========

``` bash
gem install riemann-dash
riemann-dash
```

Then open http://localhost:4567 in a browser. Riemann-dash will connect to the local host (relative to your browser) by default, and show you a small manual.

Configuring
===========

Riemann-dash takes an optional config file, which you can specify as the first
command-line argument. If none is given, it looks for a file in the local
directory: config.rb. That file can override any configuration options on the
Dash class, and hence, all Sinatra configuration.

``` ruby
set :port, 6000 # HTTP server on port 6000
config[:ws_config] = 'custom/config.json' # Specify custom workspace config
```



Development
===========

    $ git clone git://github.com/mindreframer/riemann-dash.git
    $ cd riemann-dash
    $ bundle

Releasing
==========
    $ rake build
    $ rake release

REPL
====
    $ sh/c
    > irb :001 > Riemann::Dash::VERSION
    > => "0.2.2"