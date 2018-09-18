const express = require('express');
const router = express.Router();

router.get('/',(req,res)=>{
    res.send('Amazon Control Sever Start');
});

module.exports = router;