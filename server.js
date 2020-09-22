#!/usr/bin/env nodejs
process.title = "newsec-backend"
const dotenv = require('dotenv').config()
if (dotenv.error) {
	console.warn(dotenv.error)
}
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const app = express()

const sentiAuthClient = require('senti-apicore').sentiAuthClient
const authClient = new sentiAuthClient(process.env.SENTICOREURL, process.env.PASSWORDSALT)
module.exports.authClient = authClient

// API endpoint imports

const port = process.env.NODE_PORT || 3032

app.use(helmet())
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors())




const getBuilding = require('./api/building/getBuilding')
const getBuildingImages = require('./api/building/getBuildingImages')
const addBuildingImage = require('./api/building/addBuildingImage')
const getBuildingImage = require('./api/building/getBuildingImage')
const getBuildings = require('./api/building/getBuildings')
const getBuildingsSum = require('./api/data/getBuildingsSum')
const getYearlyCo2 = require('./api/data/getYearlyCo2')
const getBuildingBenchmark = require('./api/data/getBuildingBenchmark')
const getBuildingEmission = require('./api/data/getBuildingEmission')
const getBuildingEmissionStats = require('./api/data/getBuildingEmissionStats')
const getBuildingActualUsage = require('./api/data/getBuildingActualUsage')
const getBuildingEmissionTodate = require('./api/data/getBuildingEmissionTodate')

app.use([getBuilding, getBuildingImages, addBuildingImage, getBuildingImage, getBuildings, 
	getBuildingsSum, getYearlyCo2, getBuildingBenchmark, getBuildingEmission, 
	getBuildingEmissionStats, getBuildingActualUsage, getBuildingEmissionTodate])

//---Start the express server---------------------------------------------------

const startServer = () => {
	app.listen(port, () => {
		console.log('newsec started on port', port)
	}).on('error', (err) => {
		if (err.errno === 'EADDRINUSE') {
			console.log('Service not started, port ' + port + ' is busy')
		} else {
			console.log(err)
		}
	})
}

startServer()
