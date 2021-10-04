const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const appDir = path.dirname(require.main.filename);
const { authClient } = require('../../server');
var Jimp = require('jimp');

router.get('/building/:uuid/image/:filename/:size?', async (req, res) => {
	let lease = await authClient.getLease(req)
	if (lease === false) {
		res.status(401).json()
		return
	}

	const filePath = appDir + '/images/buildings/' + req.params.filename;

	if (!fs.existsSync(filePath)) {
		res.status(404).json();
	} else {
		let ext = path.extname(req.params.filename).substr(1);

		if (req.params.size) {
			let size = parseInt(req.params.size);
			let filePathWithSize = filePath.split('.').slice(0, -1).join('.') + '-' + size + '.' + ext;

			if (!fs.existsSync(filePathWithSize)) {
				const image = await Jimp.read(filePath);
				image.resize(size, Jimp.AUTO).quality(80);
				await image.writeAsync(filePathWithSize);

				sendFile(res, filePathWithSize, ext);
			} else {
				sendFile(res, filePathWithSize, ext);
			}
		} else {
			sendFile(res, filePath, ext);
		}
	}
});

function sendFile(res, path, ext) {
	let contents = fs.readFileSync(path, { encoding: 'base64' });

	if (ext === 'png') {
		contents = 'data: image/png; base64,' + contents;
	} else {
		contents = 'data: image/jpeg; base64,' + contents;
	}

	res.setHeader('content-type', 'text/plain');
	res.status(200).send(contents);
}

module.exports = router;
