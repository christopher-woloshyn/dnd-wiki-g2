FROM nginx:alpine
# Copy the entire public folder contents into the Nginx html directory
COPY ./public/ /usr/share/nginx/html/

# Copy the server configuration
COPY ./default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80