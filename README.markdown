Riemann-Dash
============

A javascript, websockets-powered dashboard for Riemann.

Get started
==========

``` bash
    $ gem install riemann-dash
    $ riemann-dash
```

Then open http://localhost:4567 in a browser. Riemann-dash will connect to the
local host (relative to your browser) by default, and show you a small manual.
Change the IP address in the top right field to point to your Riemann server's
websocket port.

Configuring
===========

Riemann-dash takes an optional config file, which you can specify as the first
command-line argument. If none is given, it looks for a file in the local
directory: config.rb. That file can override any configuration options on the
Dash class, and hence, all Sinatra configuration. You'll find a few usage
examples in "example/config.rb".

``` ruby
set :port, 6000      # HTTP server on port 6000
set :bind, "1.2.3.4" # Bind to a different interface
config[:ws_config] = 'custom/config.json' # Specify custom workspace config
```

You can also specify the default config file to be used by setting the
`RIEMANN_DASH_CONFIG` environment variable. If set, this value will override
the default config file location of `config.rb` when no config file is passed
on the command line.

Putting in production
=====================

If you expect more than a couple of simultaneous users, you should consider
running Riemann-dash in a proper application server. The easiest way is to
install thin or puma. Riemann-dash will automatically use one of them if they
are present. You'll need the C/C++ compiler, as well as the ruby and openssl
libraries and headers installed.

``` bash
    $ gem install riemann-dash thin
    $ riemann-dash
```

Riemann-dash can also run in a web server supporting the Rack interface. An
example rackup app is found in "example/config.ru".

Development
===========

    $ git clone git://github.com/riemann/riemann-dash.git
    $ cd riemann-dash
    $ bundle

Testing
=======
    # run tests
    $ sh/test

Releasing
==========
    $ rake build
    $ rake release

REPL
====
    $ sh/c
    > irb :001 > Riemann::Dash::VERSION
    > => "0.2.2"
