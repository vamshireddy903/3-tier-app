FROM nginx:alpine
 
# Copy the frontend file into Nginx's default serve directory
COPY index.html /usr/share/nginx/html/index.html
 
# Expose port 80
EXPOSE 80
 
# Nginx runs in the foreground
CMD ["nginx", "-g", "daemon off;"]
