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
router.get('/data/buildingssum/:from/:to', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	// authClient.setStoredToken(lease.token)
	// authClient.api.setHeader('Authorization', 'Bearer ' + authClient.getStoredToken())

	// let authUser = authClient.api.get('v2/auth/user')
	// console.log(authUser)

	let select = `SELECT uuid as buildingUuid, \`no\` as buildingNo, name, deviceId, deviceUuid
					FROM building B
						INNER JOIN buildingdevices BD ON B.id = BD.buildingId AND BD.type = 'emission'`
	let rs = await mysqlConn.query(select, [])
	if (rs[0].length === 0) {
		res.status(404).json()
		return
	}
	let result = {}
	let queryIds = rs[0].map(row => {
		result[row.deviceUuid] = row
		return row.deviceUuid
	})
	dataBrokerAPI.setHeader('Authorization', 'Bearer ' + lease.token)
	let data = await dataBrokerAPI.post(`/v2/newsec/buildingsum/${req.params.from}/${req.params.to}`, queryIds)
	console.log(data.data)
	data.data.map(d => {
		result[d.uuid].value = d.val
	})
	let sortResult = Object.values(result)
	sortResult.sort((a, b) => {
		if (a.value < b.value) return 1;
		if (a.value > b.value) return -1;
		return 0;
	})
	console.log(sortResult)
	res.status(200).json(sortResult)
})
module.exports = router
