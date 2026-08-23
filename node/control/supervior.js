const superviorModel = require('../model/supervisor.js');

// CREATE
exports.createSupervisorDataCo = async (req, res) => {
    try {
        const data = await superviorModel.createSupervisorData(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ALL
exports.getAllSupervisorDataCo = async (req, res) => {
    try {
        const data = await superviorModel.getAllSupervisorData();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET BY ID
exports.getByIdSupervisorDataCo = async (req, res) => {
    try {
        const data = await superviorModel.getSupervisorDataById(req.params.id);
        if (!data) return res.status(404).json({ message: "Not found" });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
exports.updateSupervisorDataCo = async (req, res) => {
    try {
        const updated = await superviorModel.updateSupervisorData(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE
exports.deleteSupervisorDataCo = async (req, res) => {
    try {
        await superviorModel.deleteSupervisorData(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};