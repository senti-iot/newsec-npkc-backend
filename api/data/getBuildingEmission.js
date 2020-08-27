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
router.get('/data/deviceemission/:uuid/:field/:from/:to', async (req, res) => {
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

	dataBrokerAPI.setHeader('auth', process.env.SENTIDATABROKERV1AUTH)
	let data = await dataBrokerAPI.get(`/v1/devicedata-clean/${rs[0][0].deviceId}/${req.params.from}/${req.params.to}/${req.params.field}/-1`)

	Object.keys(data.data).map((key) => {
		data.data[key] = (data.data[key] / rs[0][0].arealHeated) * 1000000
	})

	console.log(data.data)
	res.status(200).json(data.data)
})
module.exports = router
