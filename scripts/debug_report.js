
const http = require('http');
const fs = require('fs');
const path = require('path');

const studentId = process.env.STUDENT_ID || '';
const classId = process.env.CLASS_ID || '';
const academicTermId = process.env.ACADEMIC_TERM_ID || 'first';

if (!studentId || !classId) {
    console.error('Error: STUDENT_ID and CLASS_ID environment variables are required');
    process.exit(1);
}

const url = `http://localhost:3000/api/admin/reports/student-report?studentId=${studentId}&classId=${classId}&academicTermId=${academicTermId}`;
const logFile = path.join(__dirname, 'debug_report_output.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

fs.writeFileSync(logFile, '');

log(`Fetching: ${url}`);

http.get(url, (res) => {
    log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json._debug) {
                log('DEBUG INFO RECEIVED:');
                log(JSON.stringify(json._debug, null, 2));
            } else {
                log('Response received but NO _debug field found.');
                // log(data.substring(0, 500));
            }
        } catch (e) {
            log('Error parsing JSON: ' + e.message);
            log('Raw Data Start: ' + data.substring(0, 100));
        }
    });

}).on('error', (err) => {
    log('HTTP Error: ' + err.message);
});
