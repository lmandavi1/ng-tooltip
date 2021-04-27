#!/usr/bin/env bash

set -x
set -e

if [[ -z "${1}" ]]; then
  echo "Target directory not specified, please pass in a target directory argument"
  exit 1
fi

if [[ -z "${2}" ]]; then
  namespace=default
else
  namespace=$2
fi

source=$1

kubectl scale deployment --replicas=0 -n $namespace harness-manager
kubectl scale deployment --replicas=0 -n $namespace verification-svc

echo "Sleeping for 60 seconds, waiting for old pods to stop"
sleep 60

cd $source && tar -xvf mongo.tar && cd -
#Do not copy the admin folder
rm -rf $source/dump/admin

kubectl cp $source/dump -n $namespace mongodb-replicaset-chart-0:/data/db/backup/
kubectl exec -it -n $namespace timescaledb-single-chart-0 -- psql -U postgres -d harness -c "DELETE FROM instance_stats;"
kubectl exec -it -n $namespace timescaledb-single-chart-0 -- psql -U postgres -d harness -c "DELETE FROM deployment;"

kubectl exec -it -n $namespace mongodb-replicaset-chart-0 -- mongorestore --uri="mongodb://admin:CA8FMywpbM@mongodb-replicaset-chart-0.mongodb-replicaset-chart,mongodb-replicaset-chart-1.mongodb-replicaset-chart,mongodb-replicaset-chart-2.mongodb-replicaset-chart:27017/harness?replicaSet=rs0&authSource=admin" --drop /data/db/backup

kubectl exec -it -n $namespace mongodb-replicaset-chart-0 -- mongo "mongodb://admin:CA8FMywpbM@mongodb-replicaset-chart-0.mongodb-replicaset-chart,mongodb-replicaset-chart-1.mongodb-replicaset-chart,mongodb-replicaset-chart-2.mongodb-replicaset-chart:27017/harness?replicaSet=rs0&authSource=admin" --eval 'db.schema.update({},{$set:{"timescaleDBDataVersion":0}});'
kubectl exec -it -n $namespace mongodb-replicaset-chart-0 -- mongo "mongodb://admin:CA8FMywpbM@mongodb-replicaset-chart-0.mongodb-replicaset-chart,mongodb-replicaset-chart-1.mongodb-replicaset-chart,mongodb-replicaset-chart-2.mongodb-replicaset-chart:27017/harness?replicaSet=rs0&authSource=admin" --eval 'db.schema.find().pretty();'

rm -rf $source/dump

kubectl scale deployment --replicas=2 -n $namespace harness-manager
kubectl scale deployment --replicas=1 -n $namespace verification-svc

