class Riemann::Dash::App
  get '/' do
    erb :index, :layout => false
  end

  get '/config', :provides => 'json' do
    content_type "application/json"
    config.read_ws_config
  end

  post '/config' do
    # Read update
    request.body.rewind
    config.update_ws_config(request.body.read)

    # Return current config
    content_type "application/json"
    config.read_ws_config
  end
end