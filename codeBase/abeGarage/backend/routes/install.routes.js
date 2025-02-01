// import express from 'express';
// import InstallController from '../controllers/install.controller';
const express = require('express');
const InstallController = require('../controllers/install.controller');

const router = express.Router();

router.get('/install', InstallController.install);

module.exports = router;