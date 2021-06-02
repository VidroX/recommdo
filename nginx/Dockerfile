FROM nginx:alpine

RUN rm /etc/nginx/conf.d/*

COPY ./prod.conf /etc/nginx/conf.d/default.conf

CMD [ "nginx", "-g", "daemon off;" ]