// import the query function from db.config.js
const query = require('../config/db.config');
// import fs module
const fs = require('fs');
// write the install function to create database tables from the sql file using fs module
const install = async () => {
    let queries = []
    let finalMessage = {}
    // define the sql file path
    const sqlFilePath = __dirname + '/sql/initial-queries.sql';
    // read the sql file
    const sql = fs.readFileSync(sqlFilePath).toString().split('\n')
    // define a variable to store a temp query
    let tempQuery = ''
    // loop through the sql file
    for (let i = 0; i < sql.length; i++) {
        // check if the line is a comment
        if (sql[i].startsWith('--')) {
            continue
        }
        // check if the line is empty
        if (sql[i].trim() === '') {
            continue
        }
        // check if the line is a query
        if (sql[i].endsWith(';')) {
            tempQuery += sql[i]
            queries.push(tempQuery)
            tempQuery = ''
        } else {
            tempQuery += sql[i]
        }
    }
    // loop through the queries 
    for (let i = 0; i < queries.length; i++) {
        try {
            // execute the query
            await query(queries[i], [])
            finalMessage = { status: 200, message: 'Database tables created successfully' }
        } catch (error) {
            console.log(error);
            finalMessage = { status: 400, message: 'Database tables creation failed' }
        }
    }
    return finalMessage
    
};
// export the install function
module.exports = { install };