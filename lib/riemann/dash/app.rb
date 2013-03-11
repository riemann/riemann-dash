module Riemann
  module Dash
    class App < Sinatra::Base
      # A little dashboard sinatra application.

      require 'yaml'
      require 'find'
      require 'erubis'
      require 'sass'

      def self.config
        @config ||= Riemann::Dash::Config.new("")
      end

      def self.setup_config(config_path)
        @config = Riemann::Dash::Config.new(config_path)
      end

      def self.load(filename)
        filename ||= 'config.rb'
        setup_config(filename)
        unless config.load_config
          # Configuration failed; load a default view.
          puts "No configuration loaded; using defaults."
        end

        config.load_controllers
        config.setup_views
        config.setup_public_dir
      end
    end
  end
end
