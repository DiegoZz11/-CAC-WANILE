const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());


const dbConfig = {
    user: 'sa',
    password: '12345', 
    server: 'localhost', 
    database: 'WANILE', 
    options: {
        encrypt: false, 
        trustServerCertificate: true 
    }
};


app.get('/api/prueba-conexion', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        res.json({ status: "success", message: "¡Conexión exitosa a la base de datos WANILE!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "Error al conectar a SQL Server", details: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor de backend corriendo en http://localhost:${PORT}`);
});