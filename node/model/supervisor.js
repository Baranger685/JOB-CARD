const pool = require('../config/db.js');

// CREATE
const createSupervisorData = async (data) => {
    const { supervisor_id, efficiency, smv, manpower, working_minutes, date, time, mark } = data;

    const result = await pool.query(
        `INSERT INTO supervisor_data 
        (supervisor_id, efficiency, smv, manpower, working_minutes, date, time, mark)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [supervisor_id, efficiency, smv, manpower, working_minutes, date, time, mark]
    );

    return result.rows[0];
};

// GET ALL
const getAllSupervisorData = async () => {
    const result = await pool.query(
        'SELECT * FROM supervisor_data ORDER BY id DESC'
    );
    return result.rows;
};

// GET BY ID
const getSupervisorDataById = async (id) => {
    const result = await pool.query(
        'SELECT * FROM supervisor_data WHERE id = $1',
        [id]
    );
    return result.rows[0];
};

// UPDATE
const updateSupervisorData = async (id, data) => {
    const { supervisor_id, efficiency, smv, manpower, working_minutes, date, time, mark } = data;

    const result = await pool.query(
        `UPDATE supervisor_data
         SET supervisor_id=$1, efficiency=$2, smv=$3, manpower=$4, working_minutes=$5, date=$6, time=$7, mark=$8
         WHERE id=$9
         RETURNING *`,
        [supervisor_id, efficiency, smv, manpower, working_minutes, date, time, mark, id]
    );

    return result.rows[0];
};

// DELETE
const deleteSupervisorData = async (id) => {
    await pool.query('DELETE FROM supervisor_data WHERE id=$1', [id]);
};

module.exports = {
    createSupervisorData,
    getAllSupervisorData,
    getSupervisorDataById,
    updateSupervisorData,
    deleteSupervisorData,
};