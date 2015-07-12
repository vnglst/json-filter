# JSON filter

Filters json IATE file based on the original tbx file.

Note: deprecated, use new tbx2json library

## Install

npm install

## How to use
node IATE-filter.js ../../data/IATE-terms.json > jq "." > IATE-nl-de.json

## For testing:
node IATE-filter.js ../../data/IATE.json 100 | jq "."
