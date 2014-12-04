require './test/test_helper'
require 'pp'

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

  describe :index_by do
    before do
      @list = [{'name' => 'a'}, {'name' => 'b'}, {'name' => 'c'}]
    end

    it "returns the list of key/value pairs as a map indexed by the specified key/value" do
      indexed_config = Riemann::Dash::BrowserConfig.index_by(lambda { |x| x['name'] }, @list)

      assert_equal({'name' => 'a'}, indexed_config['a'])
      assert_equal({'name' => 'b'}, indexed_config['b'])
      assert_equal({'name' => 'c'}, indexed_config['c'])
    end

  end

end
