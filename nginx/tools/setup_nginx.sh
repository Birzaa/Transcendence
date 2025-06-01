#!/bin/bash

YELLOW="\033[1;33m"
RESET="\033[0m"

if [ ! -f /etc/ssl/certs/nginx.crt ]; then
    echo -e "${YELLOW}[NGINX] Configuring...${RESET}"
    openssl req -x509 -nodes -newkey rsa:4096 -days 365 \
        -keyout /etc/ssl/private/nginx.key -out /etc/ssl/certs/nginx.crt \
        -subj "/C=FR/ST=Paris/L=Paris/O=wordpress/CN=abougrai.42.fr"
    echo -e "${YELLOW}[NGINX] Done.${RESET}"
fi

exec "$@"