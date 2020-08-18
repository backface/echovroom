#!/bin/bash

source .env

npm run build

docker build --network=host -t $USERNAME/$IMAGE:latest .
