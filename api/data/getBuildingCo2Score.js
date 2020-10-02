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
router.get('/data/buildingco2score/:uuid', async (req, res) => {
	// :group/:from/:to
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	let select = `SELECT B2.uuid as buildingUuid, B2.\`no\` as buildingNo, B2.name, B2.arealHeated*1.000 as arealHeated, deviceId, deviceUuid, 0 as value
					FROM building B
						INNER JOIN building B2 ON B.grouptype = B2.grouptype 
						INNER JOIN buildingdevices BD ON B2.id = BD.buildingId AND BD.type = 'emission'
					WHERE B.uuid = ?`
	console.log(mysqlConn.format(select, [req.params.uuid]))
	let rs = await mysqlConn.query(select, [req.params.uuid])
	if (rs[0].length === 0) {
		res.status(404).json()
		return
	}
	let result = {}
	let calcResult = {}
	let queryIds = rs[0].map(row => {
		result[row.deviceUuid] = row
		return row.deviceUuid
	})
	let today = moment()

	dataBrokerAPI.setHeader('Authorization', 'Bearer ' + lease.token)
	let data = await dataBrokerAPI.post(`/v2/newsec/buildingsum/${today.format('YYYY-01-01')}/${today.format('YYYY-12-31')}`, queryIds)
	data.data.map(d => {
		if (d.val > 0) {
			calcResult[d.uuid] = {
				'value': (d.val / result[d.uuid].arealHeated) * 1000,
				'buildingUuid': result[d.uuid].buildingUuid,
				'deviceUuid': d.uuid
			}	
		}
	})
	let sortResult = Object.values(calcResult)
	sortResult.sort((a, b) => {
		if (a.value < b.value) return 1;
		if (a.value > b.value) return -1;
		return 0;
	})
	let indexValue = sortResult[sortResult.length - 1].value
	let buildingValue = sortResult.filter(d => {
		return d.buildingUuid === req.params.uuid
	})[0].value
	let resultValue = (buildingValue / indexValue - 1) * 10000 / 150

	res.status(200).json({ 'result': resultValue > 100 ? 100 : Math.round(resultValue, 2) })
})
module.exports = router
