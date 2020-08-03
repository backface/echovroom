#!/bin/sh 
gcloud functions deploy --region=us-central1 --runtime=nodejs10 --memory=1024MB --timeout=120 --trigger-http testsession
