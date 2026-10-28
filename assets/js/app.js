const express = require('express');
const router = express.Router();
const db = require('../config/db');

app.use(express.json());

const porta = process.env.port || 3000;

app.listen(PORT,() =>{
  console.log(`servidor rodando com sucesso! ${PORT}`)
});

