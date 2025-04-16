@echo off
REM Change directory to MongoDB bin folder
cd /d "C:\Program Files\MongoDB\Server\8.0\bin"
mongod --dbpath C:\data\mongo-upc-database --port 27017 --oplogSize 200

pause