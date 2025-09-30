FROM nginx:latest

# Copy production nginx configuration
COPY nginx/nginx.prod.conf /etc/nginx/nginx.conf

# Expose port 443 for HTTPS
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]