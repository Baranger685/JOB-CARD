const laberModel = require('../model/laberModel.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, age, role, password } = req.body;

        // Role Validation
        const validRoles = ['admin', 'labor'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'labor'." });
        }

        const existingUser = await laberModel.getByName(name);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await laberModel.createLaber({
            name,
            age,
            role,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            user: newUser
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await laberModel.getByName(name);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ALL (Protected)
exports.getAll = async (req, res) => {
    try {
        const labers = await laberModel.getAllLabers();
        res.json(labers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET BY ID (Protected)
exports.getById = async (req, res) => {
    try {
        const laber = await laberModel.getLaberById(req.params.id);
        if (!laber) return res.status(404).json({ message: "Not found" });
        res.json(laber);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE (Admin Only)
exports.update = async (req, res) => {
    try {
        let data = req.body;
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        const updated = await laberModel.updateLaber(req.params.id, data);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE (Admin Only)
exports.delete = async (req, res) => {
    try {
        await laberModel.deleteLaber(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// // CREATE
// exports.createLaborerDataCo = async (req, res) => {
//     try {
//         const data = await laberModel.createLaborerData(req.body);
//         res.status(201).json(data);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// // GET ALL
// exports.getAllLaborerDataCo = async (req, res) => {
//     try {
//         const data = await laberModel.getAllLaborerData();
//         res.json(data);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// // GET BY ID
// exports.getByIdLaborerDataCo = async (req, res) => {
//     try {
//         const data = await laberModel.getLaborerDataById(req.params.id);
//         if (!data) return res.status(404).json({ message: "Not found" });
//         res.json(data);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// // UPDATE
// exports.updateLaborerDataCo = async (req, res) => {
//     try {
//         const updated = await laberModel.updateLaborerData(req.params.id, req.body);
//         res.json(updated);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// // DELETE
// exports.deleteLaborerDataCo = async (req, res) => {
//     try {
//         await laberModel.deleteLaborerData(req.params.id);
//         res.json({ message: "Deleted successfully" });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };


// CREATE ENTRY
exports.createLaborerDataCo = async (req, res) => {
    try {
        const data = await laberModel.createLaborerData(req.body);
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ALL
exports.getAllLaborerDataCo = async (req, res) => {
    const data = await laberModel.getAll();
    res.json(data);
};

// GET FULL ANALYSIS
exports.getAnalysisLaborerDataCo = async (req, res) => {
    try {
        const { laborers_id } = req.params;

        const history = await laberModel.getByLaborer(laborers_id);
        const avg = await laberModel.getAverageEfficiency(laborers_id);
        const trend = await laberModel.getTrend(laborers_id);

        res.json({
            laborers_id,
            average_efficiency: avg.avg_efficiency,
            weighted_average: avg.weighted_avg,
            trend,
            history
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};