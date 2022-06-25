module Riemann
  module Dash
    class App < Sinatra::Base
      # A little dashboard sinatra application.

      require 'yaml'
      require 'find'
      require 'tilt/erubi'
      require 'erubi'
      require 'sass'

      def self.config
        Riemann::Dash::Config.instance
      end

      def config
        self.class.config
      end

      def self.load(filename)
        filename ||= ENV['RIEMANN_DASH_CONFIG'] || 'config.rb'
        unless config.load_config(filename)
          # Configuration failed; load a default view.
          puts "No configuration loaded; using defaults."
        end

        config.load_controllers
        config.setup_views
        config.setup_public_dir
        config.setup_storage_backend
      end
    end
  end
end
