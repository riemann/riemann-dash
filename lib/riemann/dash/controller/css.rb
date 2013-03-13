class Riemann::Dash::App
  get '/css' do
    scss :css, :layout => false
  end
end
