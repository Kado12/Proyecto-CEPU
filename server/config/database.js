const mysql = require('mysql2');
const config = require('./environment');

const db = mysql.createConnection({
  database: config.database.name,
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  port: config.database.port
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a MySQL en Railway');
});

module.exports = db;