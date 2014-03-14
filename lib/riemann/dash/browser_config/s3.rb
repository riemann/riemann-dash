class Riemann::Dash::BrowserConfig::S3
  require 'multi_json'
  require 'fog'

  def initialize(bucket, path, config = {})
    @bucket = bucket
    @path   = path
    @config = config

    @storage = Fog::Storage.new(:region => config[:region],
                                :provider => 'AWS')
  end

  def read
    begin
      @storage.get_object(@bucket, @path).body
    rescue Excon::Errors::NotFound
      MultiJson.encode({})
    end
  end

  def update(update)
    update = MultiJson.decode update

    # Read old config
    old = MultiJson.decode read

    new = Riemann::Dash::BrowserConfig.merge_configs update, old
    @storage.put_object @bucket, @path, MultiJson.encode(new, :pretty => true)
  end
end
