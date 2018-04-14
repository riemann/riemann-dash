class Riemann::Dash::App
  get '/' do
    erubis :index, :layout => false
  end

  get '/config', :provides => 'json' do
    content_type "application/json"
    Riemann::Dash::BrowserConfig.read
  end

  post '/config' do
    # Read update
    request.body.rewind
    Riemann::Dash::BrowserConfig.update request.body.read

    # Return current config
    content_type "application/json"
    Riemann::Dash::BrowserConfig.read
  end
end
