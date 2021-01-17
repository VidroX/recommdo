#!/bin/bash
set -e

mongo <<EOF
use admin
db.createUser({
  user:  '$DATABASE_USERNAME',
  pwd: '$DATABASE_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$DATABASE_NAME'
  }]
})
EOF