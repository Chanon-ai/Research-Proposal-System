FROM node:18.17.1-alpine as app
RUN apk add --no-cache --update python3 make g++
#RUN ln -s $(which python3) /usr/local/bin/python

#RUN npm install --global node-gyp
#RUN npm install node-pre-gyp -g
RUN npm install -g node-gyp
COPY ./package.json .
RUN npm install
#COPY . .
#
#EXPOSE 7002
#ENTRYPOINT npm run start


#https://efiling.rd.go.th/rd-cms/api?utm_source=chatgpt.com
