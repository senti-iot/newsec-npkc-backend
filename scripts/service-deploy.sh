#!/bin/bash

if [[ "$1" == "master" ]]; then 
	echo
	echo Deploying newsec $1 ... 
	rsync -r --quiet $2/ deploy@rey.webhouse.net:/srv/nodejs/senti/services/newsec/production
	echo
	echo Restarting newsec service: $1 ... 
	ssh deploy@rey.webhouse.net 'sudo /srv/nodejs/senti/services/newsec/production/scripts/service-restart.sh master'
	echo
	echo Deployment to newsec $1 and restart done!
	exit 0
fi 

if [[ "$1" == "dev" ]]; then 
	echo
	echo Deploying newsec $1 ... 
	rsync -r --quiet $2/ deploy@rey.webhouse.net:/srv/nodejs/senti/services/newsec/development
	echo
	echo Restarting newsec service: $1 ... 
	ssh deploy@rey.webhouse.net 'sudo /srv/nodejs/senti/services/newsec/development/scripts/service-restart.sh dev'
	echo
	echo Deployment to newsec $1 and restart done!
	exit 0
fi