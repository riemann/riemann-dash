# -*- encoding: utf-8 -*-
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'riemann/dash/version'

Gem::Specification.new do |gem|
  gem.name          = "riemann-dash"
  gem.version       = Riemann::Dash::VERSION
  gem.authors       = ["Kyle Kingsbury"]
  gem.email         = ['aphyr@aphyr.com']
  gem.description   = %q{HTTP dashboard for the distributed event system Riemann.}
  gem.summary       = gem.description
  gem.homepage      = 'https://github.com/riemann/riemann-dash'
  gem.platform      = Gem::Platform::RUBY

  gem.add_runtime_dependency 'erubi', '~> 1.9.0'
  gem.add_runtime_dependency 'sinatra', '>= 1.4.5', '< 3.1.0'
  gem.add_runtime_dependency 'sass', '>= 3.1.14'
  gem.add_runtime_dependency 'webrick'
  gem.add_runtime_dependency 'multi_json', '1.3.6'
  gem.add_development_dependency 'minitest'
  gem.add_development_dependency 'github_changelog_generator'
  gem.add_development_dependency 'rake'
  gem.files         = `git ls-files`.split($/)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ["lib"]
end
