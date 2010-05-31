require 'rake/clean'

CLEAN.include('_site')

DEPLOY_DRY_RUN = ENV['NOSYNC'] ? "--dry-run" : nil

desc "Build the site"
task :build do
  system "jekyll --no-auto"
end

desc "Build and then upload the site"
task :deploy => [:clean, :build] do
  system "rsync -avz --delete --exclude=projects #{DEPLOY_DRY_RUN} _site/ ryancarver.com:ryancarver.com"
end

desc "Run the development server"
task :server do
  system "jekyll --server"
end