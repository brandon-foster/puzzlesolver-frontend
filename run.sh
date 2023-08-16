#!/bin/bash

docker run --rm --name puzzlesolver-frontend -p 4444:80 -v /$(pwd)/html:/var/www/html/ puzzlesolver-frontend

