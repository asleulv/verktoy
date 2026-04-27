FROM nginx:alpine

# Copy all static files to the nginx html directory
COPY . /usr/share/nginx/html

# The default nginx configuration is fine for this static site
EXPOSE 80
