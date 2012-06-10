class Riemann::Dash
  get '/ws' do
    erb :websockets, :layout => false
  end
end
