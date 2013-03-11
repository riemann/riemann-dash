require './test/test_helper'

describe "Riemann::Dash::Config" do
  it "is loaded" do
    Riemann::Dash::Config.new("").wont_be_nil
  end
end