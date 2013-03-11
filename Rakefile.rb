#$:.unshift(File.join(File.dirname(__FILE__), 'lib'))
#require 'rubygems'
require "bundler/gem_tasks"

task :default => :test
require 'rake/testtask'
Rake::TestTask.new do |t|
  t.libs.push "lib"
  t.test_files = FileList['test/**/*_test.rb']
  t.verbose    = false
end
