require './test/test_helper'


describe "Riemann::Dash::Config" do
    before do
      @config = Riemann::Dash::Config.instance
    end

    after do
      Riemann::Dash::Config.reset!
    end

  it "is loaded" do
    @config.wont_be_nil
  end

  describe :load_config do
    it "will apply configs from specified file to sinatra app" do
      @config.load_config("test/fixtures/config/basic_config.rb")
      Riemann::Dash::App.settings.settings_loaded.must_equal "yes"
    end
  end

  describe :setup_default_values do
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

  describe "applying to sinatra app" do
    describe :load_controllers do

    end

    describe :setup_views do

    end


    describe :setup_public_dir do

    end
  end

  describe "workspace config" do
    describe :read_ws_config do
      it "retuns hash for empty configs" do
        @config.read_ws_config.must_equal "{}"
      end

      it "reads the file, if present" do
        @config.load_config("test/fixtures/config/ws_config.rb").must_equal true
        @config.store[:ws_config].must_equal "test/fixtures/ws_config/dummy_config.json"
        @config.read_ws_config.must_equal %Q{{hey: \"ho\"}}
      end
    end

    describe :update_ws_config do

    end
  end
end