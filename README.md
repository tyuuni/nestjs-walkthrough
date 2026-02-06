## Description

A scratch project to walk through the features of NestJS framework.

## Project setup

```bash
# setup database
cp ./sql/* /tmp/
sudo -u postgres psql -f /tmp/setup.sql
sudo -u postgres psql -d test -f /tmp/tables.sql
sudo -u postgres psql -d test -f /tmp/initial_data.sql

npm ci
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Run tests

```bash
npm run test
npm run test:cov
```
