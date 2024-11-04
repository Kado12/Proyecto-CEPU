const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  database: {
    name: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT
  },
  email: {
    service: process.env.SERVICE,
    user: process.env.EMAIL_APP,
    password: process.env.PASSWORD_APP
  },
  app: {
    port: process.env.PORT || 3000,
    apiUrl: process.env.API_URL,
    jwtSecret: 'tu_secreto_jwt'
  }
};