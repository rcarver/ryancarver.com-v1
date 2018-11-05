require 'rake/clean'

CLEAN.include('_site')

DEPLOY_DRY_RUN = ENV['NOSYNC'] ? "--dry-run" : nil

desc "Build the site"
task :build do
  sh "bundle exec jekyll build"
end

task :build_prod_archive do
  sh "bundle exec jekyll build --baseurl=/archives/v1"
end

desc "Build and then upload the site to the archive"
task :deploy_prod_archive => [:clean, :build_prod_archive] do
  sh "s3cmd --config=.s3cfg sync _site/ #{DEPLOY_DRY_RUN} --delete-removed s3://www.ryancarver.com/archives/v1/"
end

desc "Run the development server"
task :server do
  sh "bundle exec jekyll serve --watch"
end

desc "Create a new post"
task :post do
  date = Time.now.strftime("%Y-%m-%d")
  file = "_posts/#{date}-x.html"
  FileUtils.touch(file)
  `mate #{file}`
end
