import express from 'express'
import users_router from './users.js';
import vehicleCertificates_router from './vehicleCertificates.js';
let router = express.Router()

router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

// Health simple
router.get('/health', (req, res) => res.json({ ok:true, deploymentTime: new Date().toISOString() }));

// Info de DB: útil para verificar a qué base estamos conectados
router.get('/db-info', (req, res) => {
  try{
    const mongoose = require('mongoose');
    const name = mongoose.connection?.name || mongoose.connection?.db?.databaseName || '';
    const host = mongoose.connection?.host || '';
    res.json({ ok: true, dbName: name, host });
  }catch(e){
    res.status(500).json({ ok:false, error: String(e.message||e) })
  }
});


router.use('/users', users_router)
router.use('/vehicle-certificates', vehicleCertificates_router)
export default router