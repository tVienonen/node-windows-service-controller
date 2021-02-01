import _ from 'lodash';

function parser(output: string) {
    if (output.match(/INFO: No tasks are running/)) return [];
    return output.split('\n').map(function(line: string) {
        var fields = line.trim().replace(/^"|"$/g, '').split('","');
        return {
            name: fields[0], 
            pid: parseInt(fields[1]), 
            sessionName: fields[2], 
            session: parseInt(fields[3]), 
            memory: fields[4]
        }
    });
};

module.exports = parser;

export default parser;