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

  describe :merge_workspace do
    before do
      @first_ws = {"view" => {"version" => 2}, "name" => "first"}
      @second_ws = {"view" => {"version" => 3}, "name" => "second"}
    end

    it "prioritises the workspace with the higher version" do
      merged_workspace = Riemann::Dash::BrowserConfig.merge_workspace(@first_ws, @second_ws)
      assert_equal @second_ws, merged_workspace

      merged_workspace = Riemann::Dash::BrowserConfig.merge_workspace(@second_ws, @first_ws)
      assert_equal @second_ws, merged_workspace
    end

    it "prioritises any workspace over a nil workspace" do
      merged_workspace = Riemann::Dash::BrowserConfig.merge_workspace(@first_ws, nil)
      assert_equal @first_ws, merged_workspace

      merged_workspace = Riemann::Dash::BrowserConfig.merge_workspace(nil, @first_ws)
      assert_equal @first_ws, merged_workspace
    end

    it "prioritises any workspace with a version over a workspace without a version" do
      merged_workspace = Riemann::Dash::BrowserConfig.merge_workspace(@first_ws, {"view" => {}})
      assert_equal @first_ws, merged_workspace

      merged_workspace = Riemann::Dash::BrowserConfig.merge_workspace({"view" => {}}, @first_ws)
      assert_equal @first_ws, merged_workspace
    end

    it "prioritises the first workspace if both versions are equal" do
      @second_ws['view']['version'] = @first_ws['view']['version']
      merged_workspace = Riemann::Dash::BrowserConfig.merge_workspace(@first_ws, @second_ws)
      assert_equal @first_ws, merged_workspace

    end  
  end


end
