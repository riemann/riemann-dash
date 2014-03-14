class Riemann::Dash::BrowserConfig::File
  require 'multi_json'
  require 'fileutils'

  def initialize(path)
    @path = path
  end

  def read
    if ::File.exists? @path
      ::File.open(@path, 'r') do |f|
        f.flock ::File::LOCK_SH
        f.read
      end
    else
      MultiJson.encode({})
    end
  end

  def update(update)
    update = MultiJson.decode update

    # Read old config
    old = MultiJson.decode read

    new = Riemann::Dash::BrowserConfig.merge_configs update, old

    # Save new config
    FileUtils.mkdir_p ::File.dirname(@path)
    begin
      ::File.open(@path, ::File::RDWR|::File::CREAT, 0644) do |f|
        f.flock ::File::LOCK_EX
        f.write(MultiJson.encode(new, :pretty => true))
        f.flush
        f.truncate f.pos
      end
    end
  end
end
