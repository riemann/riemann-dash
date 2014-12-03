require './test/test_helper'

describe "Riemann::Dash::BrowserConfig" do

  before do
    @mock_backend = Minitest::Mock.new
    Riemann::Dash::BrowserConfig.backend = @mock_backend
  end
  
  describe :read do
    it "delegates to its backend" do
      @mock_backend.expect :read, :return_value

      Riemann::Dash::BrowserConfig.read

      @mock_backend.verify
    end
  end

  describe :update do
    it "delegates to its backend" do
      @mock_backend.expect :update, :return_value, [String]

      Riemann::Dash::BrowserConfig.update("stuff to update")

      @mock_backend.verify
    end
  end

  describe :merge_configs do
    before do
      @first_config = {'server' => 'first_server', 'server_type' => 'first_type'}
      @second_config = {'server' => 'second_server', 'server_type' => 'second_type'}
    end

    describe "when merging the server value" do
      it "prioritises the value from the first config" do
        merged_configs = Riemann::Dash::BrowserConfig.merge_configs(@first_config, @second_config)

        assert_equal @first_config['server'], merged_configs['server']
      end

      it "uses the value from the second config if no other exists" do
        merged_configs = Riemann::Dash::BrowserConfig.merge_configs({}, @second_config)

        assert_equal @second_config['server'], merged_configs['server']
      end
    end

    describe "when merging the server_type value" do
      it "prioritises the value from the first config" do
        merged_configs = Riemann::Dash::BrowserConfig.merge_configs(@first_config, @second_config)

        assert_equal @first_config['server_type'], merged_configs['server_type']
      end

      it "uses the value from the second config if no other exists" do
        merged_configs = Riemann::Dash::BrowserConfig.merge_configs({}, @second_config)

        assert_equal @second_config['server_type'], merged_configs['server_type']
      end
    end
  end
end
