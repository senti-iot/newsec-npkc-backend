const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const appDir = path.dirname(require.main.filename);
const { authClient } = require('../../server');

router.get('/building/:uuid/image/:filename', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}

	const filePath = appDir + '/images/buildings/' + req.params.filename;

	if (!fs.existsSync(filePath)) {
		res.status(404).json();
	} else {
		let contents = fs.readFileSync(filePath, { encoding: 'base64' });
		let ext = path.extname(req.params.filename).substr(1);

		if (ext === 'png') {
			contents = 'data: image/png; base64,' + contents;
		} else {
			contents = 'data: image/jpeg; base64,' + contents;
		}

		res.setHeader('content-type', 'text/plain');
		res.status(200).send(contents);
	}

});

module.exports = router;
