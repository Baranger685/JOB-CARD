const pool = require('../config/db.js');

// CREATE
const createLaber = async (data) => {
    const { name, age, role, password } = data;

    const result = await pool.query(
        'INSERT INTO labers (name, age, role, password) VALUES ($1, $2, $3, $4) RETURNING id, name, age, role',
        [name, age, role, password]
    );

    return result.rows[0];
};

// READ ALL (exclude password)
const getAllLabers = async () => {
    const result = await pool.query(
        'SELECT id, name, age, role FROM labers ORDER BY id ASC'
    );
    return result.rows;
};

// READ BY ID
const getLaberById = async (id) => {
    const result = await pool.query(
        'SELECT id, name, age, role FROM labers WHERE id = $1',
        [id]
    );
    return result.rows[0];
};

// UPDATE (optional password update)
const updateLaber = async (id, data) => {
    const { name, age, role, password } = data;

    let query;
    let values;

    if (password) {
        query = `
            UPDATE labers 
            SET name=$1, age=$2, role=$3, password=$4 
            WHERE id=$5 
            RETURNING id, name, age, role
        `;
        values = [name, age, role, password, id];
    } else {
        query = `
            UPDATE labers 
            SET name=$1, age=$2, role=$3 
            WHERE id=$4 
            RETURNING id, name, age, role
        `;
        values = [name, age, role, id];
    }

    const result = await pool.query(query, values);
    return result.rows[0];
};

// DELETE
const deleteLaber = async (id) => {
    await pool.query('DELETE FROM labers WHERE id=$1', [id]);
};


// Find user by name (for login)
const getByName = async (name) => {
    const result = await pool.query(
        'SELECT * FROM labers WHERE name = $1',
        [name]
    );
    return result.rows[0];
};

// // CREATE
// const createLaborerData = async (data) => {
//     const { laborers_id, efficiency, smv, manpower, working_minutes, date, time, mark } = data;

//     const result = await pool.query(
//         `INSERT INTO laborers_data 
//         (laborers_id, efficiency, smv, manpower, working_minutes, date, time, mark)
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//         RETURNING *`,
//         [laborers_id, efficiency, smv, manpower, working_minutes, date, time, mark]
//     );

//     return result.rows[0];
// };

// // GET ALL
// const getAllLaborerData = async () => {
//     const result = await pool.query(
//         'SELECT * FROM laborers_data ORDER BY id DESC'
//     );
//     return result.rows;
// };

// // GET BY ID
// const getLaborerDataById = async (id) => {
//     const result = await pool.query(
//         'SELECT * FROM laborers_data WHERE id = $1',
//         [id]
//     );
//     return result.rows[0];
// };

// // UPDATE
// const updateLaborerData = async (id, data) => {
//     const { laborers_id, efficiency, smv, manpower, working_minutes, date, time, mark } = data;

//     const result = await pool.query(
//         `UPDATE laborers_data
//          SET laborers_id=$1, efficiency=$2, smv=$3, manpower=$4, working_minutes=$5, date=$6, time=$7, mark=$8
//          WHERE id=$9
//          RETURNING *`,
//         [laborers_id, efficiency, smv, manpower, working_minutes, date, time, mark, id]
//     );

//     return result.rows[0];
// };

// // DELETE
// const deleteLaborerData = async (id) => {
//     await pool.query('DELETE FROM laborers_data WHERE id=$1', [id]);
// };


// INSERT WITH CALCULATION
const createLaborerData = async (data) => {
    const { laborers_id, output, smv, date } = data;
    const working_minutes = 60;

    const efficiency = ((output * smv) / working_minutes) * 100;

    // 🔥 Status
    let status = "LOW";
    if (efficiency >= 85) status = "HIGH";
    else if (efficiency >= 60) status = "MEDIUM";

    const result = await pool.query(
        `INSERT INTO laborers_data 
    (laborers_id, output, smv, working_minutes, efficiency, status, date)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
        [laborers_id, output, smv, working_minutes, efficiency, status, date]
    );

    return result.rows[0];
};

// GET ALL
const getAll = async () => {
    const result = await pool.query('SELECT * FROM laborers_data ORDER BY date DESC, time DESC');
    return result.rows;
};

// GET BY LABORER
const getByLaborer = async (laborers_id) => {
    const result = await pool.query(
        'SELECT * FROM laborers_data WHERE laborers_id=$1 ORDER BY date',
        [laborers_id]
    );
    return result.rows;
};

// 🔥 AVERAGE
const getAverageEfficiency = async (laborers_id) => {
    const result = await pool.query(
        `SELECT 
            AVG(efficiency) as avg_efficiency,
            SUM(efficiency * working_minutes) / SUM(working_minutes) as weighted_avg
         FROM laborers_data
         WHERE laborers_id=$1`,
        [laborers_id]
    );

    return result.rows[0];
};

// 🔥 TREND (last 6 entries)
const getTrend = async (laborers_id) => {
    const result = await pool.query(
        `SELECT efficiency FROM laborers_data
         WHERE laborers_id=$1
         ORDER BY date DESC
         LIMIT 6`,
        [laborers_id]
    );

    const data = result.rows.map(r => r.efficiency);

    if (data.length < 6) return "NOT_ENOUGH_DATA";

    const last3 = (data[0] + data[1] + data[2]) / 3;
    const prev3 = (data[3] + data[4] + data[5]) / 3;

    if (last3 > prev3) return "IMPROVING";
    if (last3 < prev3) return "DECLINING";
    return "STABLE";
};


module.exports = {
    createLaber,
    getAllLabers,
    getLaberById,
    updateLaber,
    deleteLaber,
    getByName,
    // createLaborerData,
    // getAllLaborerData,
    // getLaborerDataById,
    // updateLaborerData,
    // deleteLaborerData
    createLaborerData,
    getAll,
    getByLaborer,
    getAverageEfficiency,
    getTrend
};