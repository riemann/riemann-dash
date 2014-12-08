require 'rubygems'
require 'bundler'
Bundler.setup(:default, :test)

require 'minitest/autorun'
require 'minitest/spec'
require 'minitest/mock'
#require "mocha/setup"

$LOAD_PATH.unshift File.join(File.dirname(__FILE__), '..', 'lib')
require 'riemann/dash'