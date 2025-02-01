// import installService from '../services/install.service';
const installService = require('../services/install.service');

// define install method
const install = async (req, res) => {
    try {
        // call install service
        const result = await installService.install();
        if (result.status === 200) {
            res.status(200).send('Database tables created successfully');
        } else {
            res.status(400).send('Database tables creation failed');
        } 
    } catch (error) {
        res.status(500).send(error.message);        
    }
};
// export install method
module.exports = { install };
