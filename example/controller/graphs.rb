class UState::Dash
  PARAMS = [
    'target',
    'height',
    'width',
    'areaMode',
    'from',
    'title'
  ]

  D = lambda do |x|
   "scale(summarize(derivative(#{x}), \"1h\"), 24)"
  end

  TYPES = {
    'api' =>
      [
        {'title' => 'Request Rate', 'target' => 'api.rate'},
        {'title' => 'Request Latency', 'target' => [
          'api.50',
          'api.95',
          'api.99'
        ]}
      ],
    'health' =>
      [
        {'title' => 'Memory', 'target' => '*.*.memory'},
        {'title' => 'CPU', 'target' => '*.*.cpu'},
        {'title' => 'Load', 'target' => '*.*.load'}
      ],
    'riak' =>
      [
        {'title' => 'Gets', 'target' => '*.*.riak.node_gets', 'areaMode' => 'stacked'},
        {'title' => 'Puts', 'target' => '*.*.riak.node_puts', 'areaMode' => 'stacked'},
        {'title' => 'Get Latency', 'target' => 'riak.get.*'},
        {'title' => 'Put Latency', 'target' => 'riak.put.*'},
        {'title' => 'Disk', 'target' => '*.*.riak.disk'},
        {'title' => 'Repairs', 'target' => '*.*.riak.read_repairs'},
        {'title' => 'Keys', 'target' => '*.*.riak.keys'}
      ],
    'ustate' =>
      [
        {'title' => 'Insert Rate', 'target' => '*.*.ustate.insert.rate'},
        {'title' => 'Insert Latency', 'target' => [
          '*.*.ustate.insert.50',
          '*.*.ustate.insert.95',
          '*.*.ustate.insert.99'
        ]}
      ]
  }

  def graphite(h = {})
    "http://graphite/render" + '?' + graph_opts(h)
  end

  def graph_opts(h = {})
    o = {
      'hideLegend' => 'false'
    }.merge h.select { |k, v|
      PARAMS.include? k.to_s
    }
    
    o.inject([]) { |unpacked, pair|
      case pair[1]
      when Array
        unpacked + pair[1].map { |e| [pair[0], e] }
      else
        unpacked << pair
      end
    }.map { |k, v|  
      "#{Rack::Utils.escape(k)}=#{Rack::Utils.escape(v)}"
    }.join('&')
  end

  get '/graph' do
    redirect graphite request.params
  end

  get '/graphs' do
    redirect '/graphs/tablet'
  end

  get '/graphs/*' do |type|
    @types = %w(health riak api ustate)
    @type = @title = type
    @graphs = case type
              when 'all'
                TYPES.values.inject(:|)
              else
                TYPES[type] or error 404
              end
              
    @graphs = @graphs.map do |g|
      g.merge request.params
    end

    erubis :graphs, layout: :plain
  end
end
