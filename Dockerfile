FROM nginx:1.19 AS BASE

COPY dist /var/www/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
