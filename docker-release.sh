#!/bin/bash

source .env

docker run --rm -v "$PWD":/app treeder/bump patch
version=`cat VERSION`


./docker-build.sh

# tag it
#git commit -m "v$version"
#git tag -a "v$version" -m "$v$version"
#git push
#git push --tags


docker tag $USERNAME/$IMAGE:latest $USERNAME/$IMAGE:$version

# push it
docker push $USERNAME/$IMAGE:latest
docker push $USERNAME/$IMAGE:$version
