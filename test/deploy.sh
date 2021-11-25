#!/bin/sh 
gcloud functions deploy --entry-point testsession --region=us-central1 --runtime=nodejs12 --memory=1024MB --timeout=120 --trigger-http testsession
gcloud functions deploy --entry-point testmodern --region=us-central1 --runtime=nodejs12 --memory=1024MB --timeout=120 --trigger-http testmodern
