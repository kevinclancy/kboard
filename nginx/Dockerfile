FROM nginx:latest

# Install cron and certbot
RUN apt-get update && apt-get install -y \
    cron \
    certbot \
    python3-certbot-nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy production nginx configuration
COPY nginx.prod.conf /etc/nginx/nginx.conf

# Set up cron job to renew certificates every 12 hours
RUN echo "0 */12 * * * root certbot renew --quiet" > /etc/cron.d/certbot-renew && \
    chmod 0644 /etc/cron.d/certbot-renew && \
    crontab /etc/cron.d/certbot-renew

# Create startup script to run both cron and nginx
RUN echo '#!/bin/bash\n\
cron\n\
nginx -g "daemon off;"' > /start.sh && \
    chmod +x /start.sh

# Expose port 443 for HTTPS
EXPOSE 443

CMD ["/start.sh"]