import process from 'child_process';
import Q from 'q';
import { BuiltCommand } from './sc-command';
import * as common from './common';

export default function<T = any>(command: BuiltCommand, errorParser: common.Parser, successParser?: common.Parser) {
    const sc = process.spawn(command.path, command.args);
    
    let stdout = '';

    sc.stdout.on('data', function(message) { stdout += message.toString('utf8') });

    const deferred = Q.defer<T>();

    sc.on('exit', function(code: number) { 
        if (code !== 0 && command.successCodes.indexOf(code) == -1) 
            deferred.reject(new Error(errorParser(stdout)));
        else if (successParser) deferred.resolve(successParser(stdout));
        else deferred.resolve();
    });

    return deferred.promise;   
}
