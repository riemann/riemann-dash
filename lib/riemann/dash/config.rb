class Riemann::Dash::Config
  attr_accessor :config_path
  attr_accessor :store
  def initialize(config_path)
    @config_path = config_path
    @store       = {}
    setup_default_values
  end

  def setup_default_values
    store.merge!({
      :controllers => [File.join(File.dirname(__FILE__), 'controller')],
      :views       => File.join(File.dirname(__FILE__), 'views'),
      :ws_config   => File.expand_path(File.join(File.dirname(__FILE__), '..', 'config', 'config.json')),
      :public      => File.join(File.dirname(__FILE__), 'public')
    })
  end


  # Executes the configuration file.
  def load_config
    begin
      Riemann::Dash::App.instance_eval File.read(config_path)
      true
    rescue Errno::ENOENT
      false
    end
  end

  # Load controllers.
  # Controllers can be regular old one-file-per-class, but
  # if you prefer a little more modularity, this method will allow you to
  # define all controller methods in their own files.  For example, get
  # "/posts/*/edit" can live in controller/posts/_/edit.rb. The sorting
  # system provided here requires files in the correct order to handle
  # wildcards appropriately.
  def self.load_controllers(dir)
    rbs = []
    Find.find(
      File.expand_path(dir)
    ) do |path|
      rbs << path if path =~ /\.rb$/
    end

    # Sort paths with _ last, becase those are wildcards.
    rbs.sort! do |a, b|
      as = a.split File::SEPARATOR
      bs = b.split File::SEPARATOR

      # Compare common subpaths
      l = [as.size, bs.size].min
      catch :x do
        (0...l).each do |i|
          a, b = as[i], bs[i]
          if a[/^_/] and not b[/^_/]
            throw :x, 1
          elsif b[/^_/] and not a[/^_/]
            throw :x, -1
          elsif ord = (a <=> b) and ord != 0
            throw :x, ord
          end
        end

        # All subpaths are identical; sort longest first
        if as.size > bs.size
          throw :x, -1
        elsif as.size < bs.size
          throw :x, -1
        else
          throw :x, 0
        end
      end
    end

    rbs.each do |r|
      require r
    end
  end

end