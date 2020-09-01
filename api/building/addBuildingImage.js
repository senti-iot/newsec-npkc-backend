const express = require('express');
const router = express.Router();
var mysqlConn = require('../../mysql/mysql_handler');
const { authClient } = require('../../server');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const path = require('path');
const appDir = path.dirname(require.main.filename);

router.post('/building/:uuid/image', async (req, res) => {
	let lease = await authClient.getLease(req);
	if (lease === false) {
		res.status(401).json();
		return;
	}

	const fileId = uuidv4();
	const filename = fileId + path.extname(req.body.filename);
	const filedata = Buffer.from(req.body.filedata, 'base64');

	try {
		fs.writeFileSync(appDir + '/images/buildings/' + filename, filedata);

		console.log('The file has been saved!');

		const query = 'INSERT INTO buildingimages (buildingUuid, filename) VALUES(?, ?)';
		await mysqlConn.query(query, [req.params.uuid, filename])
		 	.then(async ([rs]) => {
		 		if (rs.affectedRows !== 1) {
					throw "DB insert error";
				}
		 	})
		 	.catch(console.log);

		res.status(200).json({ filename: filename });
	} catch (error) {
		res.status(404).json();
	}
});

module.exports = router;
