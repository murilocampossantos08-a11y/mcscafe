const pool = require('./db');
async function testar() {
    try {
        const conn = await pool.getConnection();
        console.log("Banco conectado!");
        conn.release();
    } catch (err) {
        console.error(err);
    }
}

testar();
