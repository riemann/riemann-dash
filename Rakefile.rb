$:.unshift(File.join(File.dirname(__FILE__), 'lib'))

require 'rubygems'
require 'rubygems/package_task'
require 'rdoc/task'
require 'riemann/dash/version'
require 'find'
 
# Don't include resource forks in tarballs on Mac OS X.
ENV['COPY_EXTENDED_ATTRIBUTES_DISABLE'] = 'true'
ENV['COPYFILE_DISABLE'] = 'true'
 
# Gemspec
gemspec = Gem::Specification.new do |s|
  s.rubyforge_project = 'riemann-dash'
 
  s.name = 'riemann-dash'
  s.version = Riemann::Dash::VERSION
  s.author = 'Kyle Kingsbury'
  s.email = 'aphyr@aphyr.com'
  s.homepage = 'https://github.com/aphyr/riemann-dash'
  s.platform = Gem::Platform::RUBY
  s.summary = 'HTTP dashboard for the distributed event system Riemann.'

  s.add_dependency 'riemann-client', '>= 0.0.3'
  s.add_dependency 'erubis', '>= 2.7.0'
  s.add_dependency 'sinatra', '>= 1.3.2'
  s.add_dependency 'sass', '>= 3.1.14'
  s.add_dependency 'thin', '>= 1.3.1'
   
  s.files = FileList['lib/**/*', 'bin/*', 'LICENSE', 'README.markdown'].to_a
  s.executables << 'riemann-dash'
  s.require_path = 'lib'
  s.has_rdoc = true
 
  s.required_ruby_version = '>= 1.8.7'
end

Gem::PackageTask.new gemspec do |p|
end
 
RDoc::Task.new do |rd|
  rd.main = 'Riemann Dash'
  rd.title = 'Riemann Dash'
  rd.rdoc_dir = 'doc'
 
  rd.rdoc_files.include('lib/**/*.rb')
end
