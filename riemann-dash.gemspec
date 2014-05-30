# -*- encoding: utf-8 -*-
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'riemann/dash/version'

Gem::Specification.new do |gem|
  gem.rubyforge_project = 'riemann-dash'

  gem.name          = "riemann-dash"
  gem.version       = Riemann::Dash::VERSION
  gem.authors       = ["Kyle Kingsbury"]
  gem.email         = ['aphyr@aphyr.com']
  gem.description   = %q{HTTP dashboard for the distributed event system Riemann.}
  gem.summary       = gem.description
  gem.homepage      = 'https://github.com/aphyr/riemann-dash'
  gem.platform      = Gem::Platform::RUBY

  gem.add_dependency 'riemann-client', '>= 0.0.7'
  gem.add_dependency 'erubis', '>= 2.7.0'
  gem.add_dependency 'sinatra', '~> 1.4.5'
  gem.add_dependency 'sass', '>= 3.1.14'
  gem.add_dependency 'thin', '~> 1.6.2'
  gem.add_dependency 'multi_json', '1.3.6'
  gem.add_dependency 'fog'
  gem.files         = `git ls-files`.split($/)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ["lib"]
end
