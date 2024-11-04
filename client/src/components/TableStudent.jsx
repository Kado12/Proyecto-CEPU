import { useState, useEffect } from "react";

function TableStudent(props) {
  const [searchStudent, setSearchStudent] = useState('')
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    age: '',
    code: '',
    dni: '',
    phone: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleSearchChange = (event) => {
    setSearchStudent(event.target.value);
  };

  const filteredStudents = students.filter((student) => {
    return (
      student.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      student.lastname.toLowerCase().includes(searchStudent.toLowerCase()) ||
      student.code.toString().includes(searchStudent)
    );
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchStudents();
  }, []);

  // Obtener todos los items
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/student`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Crear nuevo item
  const handleCreate = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al crear el item');
      }

      const newStudent = await response.json();
      setStudents([...students, newStudent]);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Actualizar item
  const handleUpdate = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/student/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el item');
      }

      const updatedStudent = await response.json();
      setStudents(students.map(student =>
        student.id === selectedStudent.id ? updatedStudent : student
      ));
      resetForm();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Eliminar item
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este item?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/student/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el item');
      }

      setStudents(students.filter(student => student.id !== id));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Preparar item para edición
  const handleEdit = (item) => {
    setSelectedStudent(item);
    setFormData(item);
    setIsEditing(true);
  };


  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      lastname: '',
      age: '',
      code: '',
      dni: '',
      phone: ''
    });
    setSelectedStudent(null);
    setIsEditing(false);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  return (
    <>
      <input
        type="text"
        placeholder="Buscar..."
        value={searchStudent}
        onChange={handleSearchChange}
      />
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Nombre"
        />
        <input
          type="text"
          name="lastname"
          value={formData.lastname}
          onChange={handleInputChange}
          placeholder="Apellido"
        />
        <input
          type="text"
          name="age"
          value={formData.age}
          onChange={handleInputChange}
          placeholder="Edad"
        />
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          placeholder="Codigo"
        />
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="Celular"
        />
        <button type="submit">
          {isEditing ? 'Actualizar' : 'Crear'}
        </button>
        {isEditing && (
          <button type="button" onClick={resetForm}>
            Cancelar
          </button>
        )}
      </form>
      <button>Agregar</button>
      <table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Edad</th>
            <th>Código</th>
            <th>Celular</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => {
            return (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.lastname}</td>
                <td>{student.age}</td>
                <td>{student.code}</td>
                <td>{student.phone}</td>
                <td>
                  <button onClick={() => handleEdit(student)}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(student.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

export default TableStudent;