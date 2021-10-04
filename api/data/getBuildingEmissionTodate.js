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
router.get('/data/buildingemissiontodate/:uuid', async (req, res) => {
	
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	let select = `SELECT BG.year, BG.goal, BD.deviceUuid
					FROM building B
						LEFT JOIN buildinggoals BG ON B.id = BG.buildingId AND BG.year = YEAR(NOW())
						INNER JOIN buildingdevices BD ON B.id = BD.buildingId AND BD.type = 'emission'
					WHERE B.uuid = ?`
	let rs = await mysqlConn.query(select, [req.params.uuid])
	if (rs[0].length !== 1) {
		res.status(500).json()
		return
	}
	dataBrokerAPI.setHeader('Authorization', 'Bearer ' + lease.token)
	let data = await dataBrokerAPI.get(`/v2/newsec/building/emissionyeartodate/${rs[0][0].deviceUuid}`)
	let max = Math.max(...[rs[0][0].goal, data.data.co2, data.data.co2Budget])
	let result = {
		"goal": (rs[0][0].goal / max) * 100,
		"co2": (data.data.co2 / max) * 100,
		"co2Budget": (data.data.co2Budget / max) * 100
	}
	res.status(200).json(result)
})
module.exports = router
