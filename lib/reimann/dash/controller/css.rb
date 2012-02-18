class Reimann::Dash
  get '/css' do
    scss :css, :layout => false
  end
end
