FROM nginx:1.11.10-alpine

ENV WEB_DIR=/var/web/rainmaker-employee-karnataka
RUN mkdir -p ${WEB_DIR}
COPY ./build/ ${WEB_DIR}/


COPY ./nginx.conf /etc/nginx/conf.d/default.conf
