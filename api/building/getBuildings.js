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
 * MySQL connector
 * @const
 */
var mysqlConn = require('../../mysql/mysql_handler')
/**
 * Auth Client
 * @const authClient
 */
const { authClient } = require('../../server')

/**
 * Route serving a device based on UUID provided
 * @function GET /building/:uuid
 * @memberof module:routers/devices
 * @param {String} req.params.uuid UUID of the Requested Device
 */
router.get('/buildings', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	let select = `SELECT id, uuid, no, name, grouptype, relativeCO2Score, streetName, houseNumber, zipcode, city, lat, lon, owner,
					(SELECT json_arrayagg(json_object('deviceId', BD.deviceId, 'uuid', BD.deviceUuid, 'type', BD.type))
						FROM buildingdevices BD
						WHERE BD.buildingId = B.id) as devices 
					FROM  building B`
	let rs = await mysqlConn.query(select, [])
	if (rs[0].length === 0) {
		res.status(404).json()
		return
	}
	res.status(200).json(rs[0])
})
router.get('/buildings/averageco2score', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}
	let select = `SELECT sum(relativeCO2Score)/count(*) as co2score, 
						count(*) as antal, 
						sum(relativeCO2Score) as co2scoretotal
					FROM  building B`
	let rs = await mysqlConn.query(select, [])
	if (rs[0].length === 0) {
		res.status(404).json()
		return
	}
	if (rs[0].length !== 1) {
		res.status(400).json()
		return
	}
	res.status(200).json(rs[0][0])
})
module.exports = router
