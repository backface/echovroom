FROM nginx:1.19-alpine AS BASE

WORKDIR /usr/share/nginx/html
# change working directory to root of nginx webhost
# using WORKDIR is preferred to using 'RUN cd /some/path'

COPY dist /usr/share/nginx/html
