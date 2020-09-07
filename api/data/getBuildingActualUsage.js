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
 * Route serving a energy usage by building
 * @function GET /data/buildingusage/:uuid
 * @memberof module:routers/devices
 * @param {String} req.params.uuid UUID of the Requested Building
 */
router.get('/data/buildingusage/:uuid', async (req, res) => {
	
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	
	let select = `SELECT BD.deviceUuid, BD.type
					FROM building B
						INNER JOIN buildingdevices BD ON B.id = BD.buildingId AND BD.type IN ('fjernvarme', 'el')
					WHERE B.uuid = ?`
	let rs = await mysqlConn.query(select, [req.params.uuid])
	if (rs[0].length === 0) {
		res.status(404).json()
		return
	}
	let result = {
		"fjernvarme": 0,
		"el": 0,
		"total": 0,
		"fjernvarmeP": 0,
		"elP": 0,
	}
	let deviceTypes = []
	let queryIds = rs[0].map(row => {
		deviceTypes[row.deviceUuid] = row.type
		return row.deviceUuid
	})
	dataBrokerAPI.setHeader('Authorization', 'Bearer ' + lease.token)
	let data = await dataBrokerAPI.post(`/v2/newsec/building/energyusage`, queryIds)

	data.data.map(d => {
		console.log(d)
		switch (deviceTypes[d.uuid]) {
			case 'fjernvarme':
				result.fjernvarme = d.v			
				break;
			case 'el':
				result.el = d.v
				break;
		}
		result.total += d.v
	})
	result.fjernvarmeP = (result.fjernvarme / result.total) * 100
	result.elP = (result.el / result.total) * 100
	res.status(200).json(result)
})
module.exports = router
