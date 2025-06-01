FROM debian:bullseye

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        nginx \
        openssl \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 443

COPY ./conf/default.conf /etc/nginx/sites-enabled/default
COPY ./tools/setup_nginx.sh /var/www/setup_nginx.sh

RUN chmod +x /var/www/setup_nginx.sh

# Really important to set daemon off so nginx still running in foreground
ENTRYPOINT ["/var/www/setup_nginx.sh"]
CMD ["nginx", "-g", "daemon off;"]