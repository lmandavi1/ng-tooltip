#!/usr/bin/env bash

set -x
set -e

destination=${1:-.}

if [[ -z "${2}" ]]; then
  namespace=default
else
  namespace=$2
fi

current_date=$(date "+%Y.%m.%d-%H.%M.%S")

mkdir -p $destination/$current_date/dump

kubectl exec -it -n $namespace mongodb-replicaset-chart-0 -- mongodump --uri="mongodb://admin:CA8FMywpbM@mongodb-replicaset-chart-0.mongodb-replicaset-chart,mongodb-replicaset-chart-1.mongodb-replicaset-chart,mongodb-replicaset-chart-2.mongodb-replicaset-chart:27017/harness?replicaSet=rs0&authSource=admin" --out /data/db/backup/dump

kubectl cp -n $namespace mongodb-replicaset-chart-0:/data/db/backup/dump $destination/$current_date/dump
#Do not include the admin database to be copied over to the target
cd $destination/$current_date/ && tar -cvzf mongo.tar dump && cd -
rm -rf $destination/$current_date/dump/
