const express = require('express');
const cors = require('cors');
require('dotenv').config();

const laberRoutes = require('./route/laberModel.js');
const supervisorRoutes = require('./route/supervisor.js');

const app = express();

app.use(cors());
app.use(express.json());


app.use('/api/labers', laberRoutes);
app.use('/api/supervisor', supervisorRoutes);

app.get('/', (req, res) => {
    res.send('API Running...');
});


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});