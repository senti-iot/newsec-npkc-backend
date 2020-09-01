const express = require('express');
const router = express.Router();
var mysqlConn = require('../../mysql/mysql_handler');
const { authClient } = require('../../server');

router.get('/building/:uuid/images', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}

	let select = `SELECT filename
					FROM  buildingimages
					WHERE buildingUuid = ?`
	let rs = await mysqlConn.query(select, [req.params.uuid])

	if (rs[0].length === 0) {
		res.status(404).json()
		return
	}

	res.status(200).json(rs[0])
});

module.exports = router;
