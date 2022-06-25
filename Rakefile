require "bundler/gem_tasks"
require 'github_changelog_generator/task'

GitHubChangelogGenerator::RakeTask.new :changelog do |config|
    config.since_tag = '0.1.14'
    config.future_release = '0.2.0'
end

task :default => :test
require 'rake/testtask'
Rake::TestTask.new do |t|
  t.libs.push "lib"
  t.test_files = FileList['test/**/*_test.rb']
  t.verbose    = false
end
