FROM php:8.0-apache
RUN apt-get update && apt-get upgrade -y
RUN docker-php-ext-install mysqli pdo pdo_mysql && docker-php-ext-enable mysqli && docker-php-ext-enable pdo && docker-php-ext-enable pdo_mysql
COPY config/000-default.conf /etc/apache2/sites-available/
RUN a2enmod proxy && a2enmod proxy_http && a2enmod rewrite && apache2ctl restart
