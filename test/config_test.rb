require './test/test_helper'

describe "Riemann::Dash::Config" do
  it "is loaded" do
    Riemann::Dash::Config.new("").wont_be_nil
  end

  describe :load_config do
    it "will apply configs from specified file to sinatra app" do
      config = Riemann::Dash::Config.new("test/fixtures/basic_config.rb")
      config.load_config
      Riemann::Dash::App.settings.settings_loaded.must_equal "yes"
    end
  end

  describe :setup_default_values do
    before do
      @config = Riemann::Dash::Config.new("")
    end

    it "has controllers path" do
      @config.store[:controllers].first.must_match %r{/lib/riemann/dash/controller}
      @config.store[:controllers].class.must_equal Array
    end

    it "has view path" do
      @config.store[:views].must_match %r{/lib/riemann/dash/view}
    end

    it "has public path" do
      @config.store[:public].must_match %r{/lib/riemann/dash/public}
    end

    it "has workspace config" do
      @config.store[:ws_config].must_match %r{/lib/riemann/config/config.json}
    end

  end

  describe :load_controllers do

  end

  describe :setup_views do

  end


  describe :setup_public_dir do

  end
end