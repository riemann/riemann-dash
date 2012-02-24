class Riemann::Dash
  get '/css' do
    scss :css, :layout => false
  end
end
