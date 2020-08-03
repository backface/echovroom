#!/bin/sh
curl -X POST https://us-central1-fooviz-205211.cloudfunctions.net/testsession -H "Content-Type:application/json"  -d '{"arg":"test "}'
