class Riemann::Dash::Static
  def initialize(app, options = {})
    @app = app
    @root = options[:root] or raise ArgumentError, "no root"
    @file_server = ::Rack::File.new(@root)
  end

  def call(env)
    r = @app.call env
    if r[0] < 200 or 400 <= r[0]
      @file_server.call env
    else
      r
    end
  end
end
