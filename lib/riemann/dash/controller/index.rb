class Riemann::Dash
  require 'multi_json'
  require 'fileutils'
  require 'set'

  WS_CONFIG_FILE = @config[:ws_config]

  get '/' do
    erb :index, :layout => false
  end

  get '/config', :provides => 'json' do
    if File.exists? WS_CONFIG_FILE
      send_file WS_CONFIG_FILE, :type => :json
    else
      MultiJson.encode({})
    end
  end

  post '/config' do
    # Read update
    request.body.rewind
    update = MultiJson.decode(request.body.read)

    # Read old config
    if File.exists? WS_CONFIG_FILE
      old = MultiJson.decode File.read WS_CONFIG_FILE
    else
      old = {}
    end

    new_config = {}

    # Server
    new_config['server'] = update['server'] or old['server']

    p update['workspaces']
    new_config['workspaces'] = update['workspaces'] or old['workspaces']

    # Save new config
    FileUtils.mkdir_p 'config'
    File.open(WS_CONFIG_FILE, 'w') do |f|
      f.write(MultiJson.encode(new_config))
    end

    # Return current config
    content_type "application/json"
    MultiJson.encode(new_config)
  end
end
