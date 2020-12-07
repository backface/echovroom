#!/bin/bash

source .env.local

docker run --rm -v "$PWD":/app treeder/bump patch
version=`cat VERSION`


./docker-build.sh

# tag it
#git commit -m "v$version"
#git tag -a "v$version" -m "$v$version"
#git push
#git push --tags


docker tag $DOCKER_USERNAME/$DOCKER_IMAGE:latest $DOCKER_USERNAME/$IMAGE:$version

# push it
docker push $DOCKER_USERNAME/$DOCKER_IMAGE:latest
docker push $DOCKER_USERNAME/$DOCKER_IMAGE:$version
