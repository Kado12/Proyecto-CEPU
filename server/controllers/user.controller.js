const db = require('../config/database');

const getProfile = (req, res) => {
  db.query(
    'SELECT id, email, created_at FROM users WHERE id = ?',
    [req.userId],
    (error, userResults) => {
      if (error) {
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      console.log(userResults[0])
      db.query(
        'SELECT * FROM students',
        (error, studentResults) => {
          if (error) {
            return res.status(500).json({ error: 'Error en el servidor' });
          }

          res.json({
            user: userResults[0],
            students: studentResults
          });
        }
      );
    }
  );
};

module.exports = {
  getProfile
};