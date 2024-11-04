const db = require('../config/database');

const getStudents = async (req, res) => {
  db.query('SELECT * FROM students', (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al obtener los registros' });
    }
    res.json(results);
  });
}

const getStudentById = async (req, res) => {
  const { id } = req.params;

  db.query('SELECT * FROM students WHERE id = ?', [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al obtener el registro' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json(results[0]);
  });
}

const createNewRegister = async (req, res) => {
  const newRegister = req.body;

  db.query('INSERT INTO students SET ?', newRegister, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al crear el registro' });
    }

    db.query('SELECT * FROM students WHERE id = ?', [results.insertId], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error al obtener el registro creado' });
      }
      res.status(201).json(results[0]);
    });
  });
}

const updatedRegister = async (req, res) => {
  const { id } = req.params;
  const updatedItem = req.body;
  db.query('UPDATE students SET ? WHERE id = ?', [updatedItem, id], (error) => {
    if (error) {
      return res.status(500).json({ error: 'Error al actualizar el registro' });
    }

    db.query('SELECT * FROM students WHERE id = ?', [id], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error al obtener el registro actualizado' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }

      res.json(results[0]);
    });
  })
}

const deletedRegister = async (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM students WHERE id = ?', [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al eliminar el registro' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Registro eliminado exitosamente' });
  });
}

module.exports = {
  getStudents,
  getStudentById,
  createNewRegister,
  updatedRegister,
  deletedRegister
}