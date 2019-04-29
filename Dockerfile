FROM epitechcontent/epitest-docker

# blih installation
WORKDIR /blih
ADD https://github.com/bocal/blih/archive/v1.7.zip ./blih.zip
RUN ls
RUN unzip blih.zip
RUN cp blih-1.7/blih.py /usr/bin/blih
RUN sed -i "1s/.*/#!\/usr\/bin\/env python3/" /usr/bin/blih

# server installation
WORKDIR /app
COPY package* /app/
RUN npm install
COPY src/ ./src/

CMD [ "blih" ]