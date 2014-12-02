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
end
