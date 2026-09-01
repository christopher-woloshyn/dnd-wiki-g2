FROM nginx:alpine
# Copy the entire public folder contents into the Nginx html directory
COPY ./public/ /usr/share/nginx/html/

# Copy the server configuration and password lock
COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY ./.htpasswd /etc/nginx/.htpasswd
EXPOSE 80