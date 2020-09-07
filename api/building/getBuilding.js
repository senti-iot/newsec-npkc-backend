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
router.get('/building/:uuid', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}

	let select = `SELECT *, 
					(SELECT json_arrayagg(json_object('deviceId', BD.deviceId, 'uuid', BD.deviceUuid, 'type', BD.type))
						FROM buildingdevices BD
						WHERE BD.buildingId = B.id) as devices,
					(SELECT json_arrayagg(json_object('year', BG.year, 'goal', BG.goal))
						FROM buildinggoals BG
						WHERE BG.buildingId = B.id) as goals	
					FROM  building B 
					WHERE B.uuid = ?`
	let rs = await mysqlConn.query(select, [req.params.uuid])
	if (rs[0].length === 0) {
		res.status(404).json()
		return
	}
	if (rs[0].length !== 1) {
		res.status(400).json()
		return
	}

	let selectImages = 'SELECT filename FROM buildingimages WHERE buildingUuid = ?';
	let rsImages = await mysqlConn.query(selectImages, [req.params.uuid]);

	let images = [];
	if (rs[0].length > 0) {
		images = rsImages[0];
	}

	rs[0][0].images = images;

	res.status(200).json(rs[0][0])
})

// router.get('/v2/internal/fixaclcloudfunctions', async (req, res) => {
// 	let select = `SELECT CF.name as dtname, CF.uuid as dtuuid, O.name as orgname, O.uuid as orguuid, AOR.uuid as orgresuuid
// 					FROM cloudFunction CF
// 						INNER JOIN organisation O ON CF.orgId = O.id
// 						INNER JOIN aclOrganisationResource AOR ON AOR.orgId = O.id
// 						INNER JOIN aclResource AR ON AR.id = AOR.resourceId AND AR.type = 8`
// 	let rs = await mysqlConn.query(select, [])
// 	if (rs[0].length === 0) {
// 		res.status(404).json()
// 		return
// 	}
// 	let result = []
// 	await rs[0].forEach(async row => {
// 		console.log(row)
// 		await aclClient.registerResource(row.dtuuid, sentiAclResourceType.cloudFunction)
// 		await aclClient.addResourceToParent(row.dtuuid, row.orgresuuid)
// 		result.push(row)
// 	})
// 	res.status(200).json(result)
// })

// router.get('/v2/internal/fixacldevicetype', async (req, res) => {
// 	let select = `SELECT DT.name as dtname, DT.uuid as dtuuid, O.name as orgname, O.uuid as orguuid, AOR.uuid as orgresuuid
// 					FROM deviceType DT
// 						INNER JOIN organisation O ON DT.orgId = O.id
// 						INNER JOIN aclOrganisationResource AOR ON AOR.orgId = O.id
// 						INNER JOIN aclResource AR ON AR.id = AOR.resourceId AND AR.type = 8`
// 	let rs = await mysqlConn.query(select, [])
// 	if (rs[0].length === 0) {
// 		res.status(404).json()
// 		return
// 	}
// 	let result = []
// 	await rs[0].forEach(async row => {
// 		console.log(row)
// 		await aclClient.registerResource(row.dtuuid, sentiAclResourceType.deviceType)
// 		await aclClient.addResourceToParent(row.dtuuid, row.orgresuuid)
// 		result.push(row)
// 	})
// 	res.status(200).json(result)
// })

// router.get('/v2/internal/fixaclreg', async (req, res) => {
// 	let select = `SELECT R.name as regname, R.uuid as reguuid, O.name as orgname, O.uuid as orguuid, AOR.uuid as orgresuuid
// 					FROM registry R
// 						INNER JOIN organisation O ON R.orgId = O.id
// 						INNER JOIN aclOrganisationResource AOR ON AOR.orgId = O.id
// 						INNER JOIN aclResource AR ON AR.id = AOR.resourceId AND AR.type = 8`
// 	let rs = await mysqlConn.query(select, [])
// 	if (rs[0].length === 0) {
// 		res.status(404).json()
// 		return
// 	}
// 	let result = []
// 	rs[0].forEach(async row => {
// 		console.log(row)
// 		await aclClient.registerResource(row.reguuid, sentiAclResourceType.registry)
// 		await aclClient.addResourceToParent(row.reguuid, row.orgresuuid)
// 		result.push(row)
// 	})
// 	res.status(200).json(result)
// })

// router.get('/v2/internal/fixacldevice', async (req, res) => {
// 	let select = `SELECT D.id, D.uuid as devuuid, D.name, R.uuid as reguuid
// 	FROM device D
// 		INNER JOIN registry R ON R.id = D.reg_id`
// 	let rs = await mysqlConn.query(select, [])
// 	if (rs[0].length === 0) {
// 		res.status(404).json()
// 		return
// 	}
// 	let result = []

// 	await rs[0].reduce(async (promise, row) => {
// 		await promise;
// 		console.log(row)
// 		await aclClient.registerResource(row.devuuid, sentiAclResourceType.device)
// 		await aclClient.addResourceToParent(row.devuuid, row.reguuid)
// 	}, Promise.resolve());
// 	res.status(200).json()
// })
module.exports = router
