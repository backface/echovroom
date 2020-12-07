#!/bin/bash

source .env.local

npm run build

docker build --network=host -t $DOCKER_USERNAME/$DOCKER_IMAGE:latest .
