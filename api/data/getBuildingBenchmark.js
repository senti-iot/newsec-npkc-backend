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
router.get('/data/buildingbenchmark/:from/:to', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	let select = `SELECT SUM(arealHeated) as arealHeated
	FROM building B
		INNER JOIN buildingdevices BD ON B.id = BD.buildingId AND BD.type = 'emission'`
	let rs = await mysqlConn.query(select, [])
	if (rs[0].length !== 1) {
		res.status(500).json()
		return
	}

	dataBrokerAPI.setHeader('Authorization', 'Bearer ' + lease.token)
	let data = await dataBrokerAPI.get(`/v2/newsec/benchmarkbyday/74/82/${req.params.from}/${req.params.to}`)

	data.data.map(d => {
		d.arealHeated = rs[0][0].arealHeated
		d.valueTon = d.value
		d.value = (d.total / rs[0][0].arealHeated) * 1000000
	})

	console.log(data.data)
	res.status(200).json(data.data)
})

/**
 * Route serving a benchmark for a building
 * @function GET /data/buildingbenchmark/:uuid/:from/:to
 * @memberof module:routers/devices
 * @param {String} req.params.uuid UUID of the Requested building
 * @param {String} req.params.from from datetime
 * @param {String} req.params.to to datetime
 */
router.get('/data/buildingbenchmark/:uuid/:from/:to', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	let select = `SELECT SUM(arealHeated) as arealHeated, json_arrayagg(deviceUuid) as devices
					FROM building B
						INNER JOIN buildingdevices BD ON B.id = BD.buildingId AND BD.type = 'emission'
					WHERE grouptype = (SELECT grouptype FROM building WHERE uuid = ?)`
	let rs = await mysqlConn.query(select, [req.params.uuid])
	if (rs[0].length !== 1) {
		res.status(500).json()
		return
	}

	dataBrokerAPI.setHeader('Authorization', 'Bearer ' + lease.token)
	let data = await dataBrokerAPI.post(`/v2/newsec/benchmarkbyday/${req.params.from}/${req.params.to}`, rs[0][0].devices)

	data.data.map(d => {
		d.arealHeated = rs[0][0].arealHeated
		d.valueTon = d.value
		d.value = (d.total / rs[0][0].arealHeated) * 1000000
	})

	console.log(data.data)
	res.status(200).json(data.data)
})
module.exports = router
