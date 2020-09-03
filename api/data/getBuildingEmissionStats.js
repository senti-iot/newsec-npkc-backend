/** Express router providing user related routes
 * @module routers/devices
 * @requires express
 * @requires senti-apicore
 */

/**
 * express module
 * @const
 */
const express = require('express')
/**
 * express router
 * @const
 */
const router = express.Router()
/**
 * createAPI
 * @const
 */
const createAPI = require('apisauce').create
/**
 * moment
 * @const
 */
const moment = require('moment')

/**
 * MySQL connector
 * @const
 */
var mysqlConn = require('../../mysql/mysql_handler')
/**
 * Auth Client
 * @const authClient
 */
const { authClient } = require('../../server')

const dataBrokerAPI = createAPI({
	baseURL: process.env.SENTIDATABROKER,
	headers: { 
		'Accept': 'application/json', 
		'Content-Type': 'application/json',
		'User-Agent': 'Senti.io v2'
	}
})
/**
 * Route serving a device based on UUID provided
 * @function GET /building/:uuid
 * @memberof module:routers/devices
 * @param {String} req.params.uuid UUID of the Requested Device
 */
router.get('/data/deviceemissionstats/:uuid/:field/:from/:to', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	let select = `SELECT B.arealHeated, BD.deviceId
	FROM building B
		INNER JOIN buildingdevices BD ON B.id = BD.buildingId AND BD.deviceUuid = ?`
	let rs = await mysqlConn.query(select, [req.params.uuid])
	if (rs[0].length !== 1) {
		res.status(500).json()
		return
	}

	let dates = {
		from: moment(req.params.from),
		to: moment(req.params.to),
		days: null,
		previousFrom: null,
		previouTo: null
	}
	dates.days = dates.to.diff(dates.from, 'days')
	dates.previousFrom = moment(req.params.from).subtract(dates.days, 'days')




	dataBrokerAPI.setHeader('auth', process.env.SENTIDATABROKERV1AUTH)
	let data1 = await dataBrokerAPI.get(`/v1/devicedata-clean/${rs[0][0].deviceId}/${dates.from.format('YYYY-MM-DD HH:mm:ss')}/${dates.to.format('YYYY-MM-DD HH:mm:ss')}/${req.params.field}/-1`)
 	// console.log(`/v1/devicedata-clean/${rs[0][0].deviceId}/${dates.from.format('YYYY-MM-DD HH:mm:ss')}/${dates.to.format('YYYY-MM-DD HH:mm:ss')}/${req.params.field}/-1`, data1.data)
	let result = {
		actualSum: 0,
		actualCount: 0,
		previousSum: 0,
		averageSum: 0,
		reduction: 0,
		unit: "g"
	}
	Object.keys(data1.data).map((key) => {
		result.actualSum += data1.data[key]
		result.actualCount += 1
	})
	let data2 = await dataBrokerAPI.get(`/v1/devicedata-clean/${rs[0][0].deviceId}/${dates.previousFrom.format('YYYY-MM-DD HH:mm:ss')}/${dates.from.format('YYYY-MM-DD HH:mm:ss')}/${req.params.field}/-1`)
	// console.log(`/v1/devicedata-clean/${rs[0][0].deviceId}/${dates.previousFrom.format('YYYY-MM-DD HH:mm:ss')}/${dates.from.format('YYYY-MM-DD HH:mm:ss')}/${req.params.field}/-1`, data2.data)
	Object.keys(data2.data).map((key) => {
		result.previousSum += data2.data[key] 
	})

	let multiplier = 1000000

	result.averageSum = multiplier * (result.actualSum / result.actualCount) / rs[0][0].arealHeated
	
	if ((result.actualSum / rs[0][0].arealHeated) >= 0.001) {
		multiplier = 1000
		result.unit = "kg"
	}
	result.actualSum = multiplier * (result.actualSum / rs[0][0].arealHeated)
	result.previousSum = multiplier * (result.previousSum / rs[0][0].arealHeated)
	result.reduction = result.previousSum > 0 ? Math.round(10000 * (result.actualSum / result.previousSum - 1)) / 100 : '-'

	res.status(200).json(result)
})
module.exports = router
