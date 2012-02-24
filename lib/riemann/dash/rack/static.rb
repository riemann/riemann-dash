class Riemann::Dash::Static
  def initialize(app, options = {})
    @app = app
    @root = options[:root] or raise ArgumentError, "no root"
    @file_server = ::Rack::File.new(@root)
  end

  def call(env)
    r = @file_server.call env
    if r[0] == 404   
      @app.call env
    else
      r
    end
  end
end
