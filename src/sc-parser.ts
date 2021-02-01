import _ from 'lodash';
import escapeRegex from 'escape-string-regexp';

function getNameValueRegex(name: string, value: string, flags?: string) {
    return new RegExp(escapeRegex(name) + '\\s*[=:]' + value, flags);
}

function matchGroupOrDefault(source: string, regex: Parameters<String['match']>[0], defaultValue?: any) {
    var result = source.match(regex);
    return result && result.length > 1 ? _.trim(result[1]) : defaultValue;
}

function getValue(source: string, name: string, defaultValue?: any) {
    return matchGroupOrDefault(source, 
        getNameValueRegex(name, '(.*)'), defaultValue);
}

function getCodeNameValue(source: string, name: string, defaultValue?: any) {
    return matchGroupOrDefault(source, 
        getNameValueRegex(name, '\\s*\\d*\\s*(.*)'), defaultValue);
}

function getFlags(source: string, name: string) {
    return matchGroupOrDefault(source, 
        new RegExp(escapeRegex(name) + '\\s*:\\s.*\\s*\\((.*)\\)'));
}

function getArrayValue(source: string, name: string) {
    source = matchGroupOrDefault(source, 
        new RegExp(escapeRegex(name) + '((\\s*:.*)*)'));
    if (!source) return [];
    var regex = /\s*:\s*(.*)/g;
    var results = [];
    var match;
    while (match = regex.exec(source)) {
        if (match[1]) results.push(match[1]); 
    }
    return results;
}

function getNumericValue(source: string, name: string, hex?: boolean, defaultValue?: any) {
    var value = matchGroupOrDefault(source, 
        getNameValueRegex(name, '\\s*((0x)?\\d*)'), defaultValue);
    if (hex && !_.startsWith('0x')) value = '0x' + value;
    return parseInt(value);
}

function getHexValue(source: string, name: string, defaultValue?: any) {
    return parseInt(getValue(source, name, defaultValue));
}

function getBooleanValue(source: string, name: string, defaultValue?: any) {
    return Boolean(matchGroupOrDefault(source, 
        getNameValueRegex(name, '\\s*(true|false)', 'i'), defaultValue));
}

export function error(output: string) {
    const result = getValue(output, 'ERROR') ||
                 matchGroupOrDefault(output, /^\[SC\].*\s*(.*)/);
    return result || output;
}
export function displayName(output: string) {
    return getValue(output, 'Name', output);
}
export function keyName(output: string) {
    return getValue(output, 'Name', output);
}
export function description(output: string) {
    return getValue(output, 'DESCRIPTION', output);
}
export function descriptor(output: string) {
    return matchGroupOrDefault(output, /\s*(.*)\s*/, output);
}
export function lock(output: string) {
    return {
        locked: getBooleanValue(output, 'IsLocked', false),
        owner: getValue(output, 'LockOwner', ''),
        duration: getNumericValue(output, 'LockDuration', false, 0)
    };
}
export function failureConfig(output: string) {
    return {
        resetPeriod: getNumericValue(output, 'RESET_PERIOD (in seconds)', false, 0),
        rebootMessage: getValue(output, 'REBOOT_MESSAGE', ''),
        commandLine: getValue(output, 'COMMAND_LINE', ''),
        failureActions: getValue(output, 'FAILURE_ACTIONS', '')
    };
}
export function config(output: string) {
    return {
        type: { 
            code: getNumericValue(output, 'TYPE', true, 0), 
            name: getCodeNameValue(output, 'TYPE', '')
        },
        startType: { 
            code: getNumericValue(output, 'START_TYPE', true, 0), 
            name: getCodeNameValue(output, 'START_TYPE', '')
        },
        errorControl: { 
            code: getNumericValue(output, 'ERROR_CONTROL', true, 0), 
            name: getCodeNameValue(output, 'ERROR_CONTROL', '')
        },
        binPath: getValue(output, 'BINARY_PATH_NAME', ''),
        loadOrderGroup: getValue(output, 'LOAD_ORDER_GROUP', ''),
        tag: getNumericValue(output, 'TAG', false, 0),
        displayName: getValue(output, 'DISPLAY_NAME', ''),
        dependencies: getArrayValue(output, 'DEPENDENCIES'),
        serviceStartName: getValue(output, 'SERVICE_START_NAME', '')
    };
}
export function services(output: string) {
    return output.split(/\r?\n\r?\n/)
        .filter(function(output) { return /SERVICE_NAME/.test(output); })
        .map(function(output) {
            var state = getNumericValue(output, 'STATE', true, 0);
            var service = {
                name: getValue(output, 'SERVICE_NAME', ''),
                displayName: getValue(output, 'DISPLAY_NAME', ''),
                type: { 
                    code: getNumericValue(output, 'TYPE', true, 0), 
                    name: getCodeNameValue(output, 'TYPE', '')
                },
                state: { 
                    code: state, 
                    name: getCodeNameValue(output, 'STATE', ''),
                    running: state === 4,
                    paused: state === 7,
                    stopped: state === 1
                },
                win32ExitCode: getNumericValue(output, 'WIN32_EXIT_CODE', false, 0),
                serviceExitCode: getNumericValue(output, 'SERVICE_EXIT_CODE', false, 0),
                checkpoint: getHexValue(output, 'CHECKPOINT', 0),
                waitHint: getHexValue(output, 'WAIT_HINT', 0)
            } as Record<string, any>;
            var accepted = getFlags(output, 'STATE');
            var pid = getNumericValue(output, 'PID', false, null);
            var flags = getValue(output, 'FLAGS', null);
            if (accepted) service.accepted = accepted.split(', ');
            if (pid) service.pid = pid;
            if (flags) service.flags = flags;
            return service;
        });
}