import _ from 'lodash';


export interface ArgsOut {
    args: string[];
    options: Record<string, any>;
    server?: string;
}

export interface BuiltCommand {
    path: string;
    args: string[];
    successCodes: number[];
    service?: string;
    server?: string;
}
export interface BuiltControlCommand {
    command: string;
    commands: BuiltCommand[];
    server?: string;
    serial?: boolean;
    waitForExit?: boolean;
}
export interface CreateCommandOptions {
    /**
     * Specifies the service type. interact must be used in conjunction with interact option.
     */
    type: 'own'|'share'|'kernel'|'filesys'|'rec'|'adapt'|'interact';
    /**
     * Specifies interaction type. Must be used in conjunction with a type of interact.
     */
    interact?: 'own'|'share';
    /**
     * Specifies the start type for the service. The default start is demand.
     */
    start?: 'boot'|'system'|'auto'|'demand'|'disabled';
    /**
     * Specifies the severity of the error if the service fails to start during boot.
     * The default is normal.
     */
    error?: 'normal'|'severe'|'critical'|'ignore';
    /**
     * Specifies a path to the service binary file. There is no default for binpath 
     * and this string must be supplied.
     */
    binpath: string;
    /**
     * Specifies the name of the group of which this service is a member. 
     * The list of groups is stored in the registry in the 
     * HKLM\System\CurrentControlSet\Control\ServiceGroupOrder subkey. 
     * The default is null.
     */
    group?: string|null;
    /**
     * Specifies whether or not to obtain a TagID from the CreateService call. 
     * Tags are only used for boot-start and system-start drivers.
     */ 
    tag?: boolean;
    /**
     * Specifies the names of services or groups which must start before 
     * this service.
     */
    depend?: string[];
    /**
     * Specifies a name of an account in which a service will run, or 
     * specifies a name of the Windows driver object in which the driver 
     * will run. The default is LocalSystem.
     */
    obj?: string;
    /**
     * Specifies a friendly, meaningful name that can be used in user-interface 
     * programs to identify the service to users. For example, the subkey name 
     * of one service is wuauserv, which is not be helpful to the user, and the 
     * display name is Automatic Updates.
     */
    displayname?: string;
    /**
     * Specifies a password. This is required if an account other 
     * than the LocalSystem account is used.
     */
    password?: string;
}
export type CommandOpts = Record<string, any>;

export type Args = IArguments;
/**
 * adds arguments to an argument array
 * @param args array containing the args
 * @param name name of the argument
 * @param value value for the argument
 */
function addArg<T>(args: string[], name: string, value: T) {
    if (value) args.push(name + '=', String(value));
}
/**
 * Converts computer name to a valid UNC path for Windows
 * 
 * {@link https://en.wikipedia.org/wiki/Path_(computing)#Universal_Naming_Convention}
 * @param computerName the name of the computer to convert to a qualified UNC path
 */
function qualifyUNCPath(computerName: string) {
    return `\\\\${_.trimStart(computerName, '\\')}`;
}
/**
 * Maps raw input arguments to ArgsOut object
 * @param args raw arguments to parse
 * @param fixed number of fixed arguments
 * if equal to arguments length first argument will be treated as the server name
 */
function getArgs(args: Args, fixed: number) {
    const argsIn = _.toArray(args);
    let server, options;
    if (_.isObject(_.last(argsIn)) && !Array.isArray(_.last(argsIn))) 
        options = argsIn.pop();
    if (argsIn.length === fixed) server = argsIn.shift() as string;
    const argsOut = { 
        args: argsIn,
        options: options || {}
    } as ArgsOut;
    if (server) argsOut.server = server; 
    return argsOut;
}
/**
 * Builds an sc command from command name, server name, arguments and success codes
 * @param commandName name of the sc command
 * @param server server to use as the target of the command
 * @param argsIn arguments to pass to the command
 * @param successCodes success codes used to determine the successfulness of the command
 */
function buildCommand(commandName: string, server?: string, argsIn?: string[], successCodes?: number[]) {
    const argsOut = [];
    if (server) argsOut.push(qualifyUNCPath(server));
    argsOut.push(commandName);
    if (Array.isArray(argsIn)) {
        argsOut.push(...argsIn);
    } else if (argsIn != null) {
        argsOut.push(argsIn);
    }
    return {
        path: 'sc',
        args: argsOut,
        successCodes: successCodes || []
    } as BuiltCommand;
}
/**
 * 
 * @param commandName name of the sc command
 * @param args raw arguments to the command
 * @param fixed number of fixed arguments
 * @param buffer size of buffer used in some of the commands
 */
function buildSimpleCommand(commandName: string, args: Args, fixed: number, buffer?: number) {
    const argsIn = getArgs(args, fixed);
    if (buffer) {
        argsIn.args.push(String(buffer));
    }
    return buildCommand(commandName, argsIn.server, argsIn.args);
}
/**
 * Converts a boolean value to 'yes' or 'no'. If value is not boolean returns the value.
 * @param value value to convert
 */
function toYesNo(value: any) {
    if (value === true) return 'yes';
    if (value === false) return 'no';
    return value;
}
/**
 * converts array value to string that is separated by slashes
 * @param value array of strings to convert to slash separated string
 */
function toSlashSeperated(value?: string[]) {
    return value ? value.join('/') : value;
}
/**
 * Build a CONTROL command for sc.exe
 * @param args arguments to the control command
 * @param commandName name of the command
 * @param successCodes success codes used to determine the successful completion of the command
 */
function buildControlCommand(args: Args, commandName: string, successCodes?: number[]) {
    const argsIn = getArgs(args, 2);
    const services = (Array.isArray(argsIn.args[0]) ? argsIn.args[0] : [ argsIn.args[0] ]) as string[];

    const command = _.merge({
        command: commandName,
        commands: services.map(function(service) {
            var argsOut = [ service ];
            if (argsIn.options.args) argsOut.push.apply(argsOut, argsIn.options.args);
            var command = buildCommand(commandName, argsIn.server, argsOut, successCodes);
            command.service = service;
            if (argsIn.server) command.server = argsIn.server;
            return command;
        })
    }, argsIn.options);
    if (argsIn.server) command.server = argsIn.server;
    return command as BuiltControlCommand;
}

function addConfigArgs(args: string[], options: CreateCommandOptions) {
    addArg(args, 'type', options.type);
    addArg(args, 'type', options.interact);
    addArg(args, 'start', options.start);
    addArg(args, 'error', options.error);
    addArg(args, 'binpath', options.binpath);
    addArg(args, 'group', options.group);
    addArg(args, 'tag', toYesNo(options.tag));
    addArg(args, 'depend', toSlashSeperated(options.depend));
    addArg(args, 'obj', options.obj);
    addArg(args, 'displayname', options.displayname);
    addArg(args, 'password', options.password);
}
// ********** Control *******************
export function start(args: Args) {
    return buildControlCommand(args, 'start', [ 1056 ]);
}
export function pause(args: Args) {
    return buildControlCommand(args, 'pause');
}
// To not use the reserved keyword continue
function continue_sc(args: Args) {
    return buildControlCommand(args, 'continue');
}
export { continue_sc as continue };
export function stop(args: Args) {
    return buildControlCommand(args, 'stop', [ 1062 ]);
}
export function control(args: Args) {
    return buildSimpleCommand('control', args, 3);
}
export function interrogate(args: Args) {
    return buildSimpleCommand('interrogate', args, 2);
}
// ********** Management *******************
export function create(args: Args) {
    const argsIn = getArgs(args, 2);
    const argsOut = [ argsIn.args[0] ];
    addConfigArgs(argsOut, argsIn.options as CreateCommandOptions);
    return buildCommand('create', argsIn.server, argsOut);
}
export function getDisplayName(args: Args) {
    return buildSimpleCommand('getdisplayname', args, 2, 4096);
}
export function getKeyName(args: Args) {
    return buildSimpleCommand('getkeyname', args, 2, 4096);
}
export function getDescription(args: Args) {
    return buildSimpleCommand('qdescription', args, 2, 8192);
}
export function setDescription(args: Args) {
    return buildSimpleCommand('description', args, 3);
}
export function getDependencies(args: Args) {
    return buildSimpleCommand('enumdepend', args, 2, 262144);
}
export function setDescriptor(args: Args) {
    return buildSimpleCommand('sdset', args, 3);
}
export function getDescriptor(args: Args) {
    return buildSimpleCommand('sdshow', args, 2);
}
export function getConfig(args: Args) {
    return buildSimpleCommand('qc', args, 2, 8192);
}
export function setConfig(args: Args) {
    const argsIn = getArgs(args, 2);
    const argsOut = [ argsIn.args[0] ];
    addConfigArgs(argsOut, argsIn.options as CreateCommandOptions);
    return buildCommand('config', argsIn.server, argsOut);
}
export function getFailureConfig(args: Args) {
    return buildSimpleCommand('qfailure', args, 2, 8192);
}
export function setFailureConfig(args: Args) {
    const argsIn = getArgs(args, 2);
    const argsOut = [ argsIn.args[0] ];
    const options = argsIn.options;
    addArg(argsOut, 'reset', options.reset);
    addArg(argsOut, 'reboot', options.reboot);
    addArg(argsOut, 'command', options.command);
    if (options.actions) {
        const actions = [];
        if (options.actions.restart) 
            actions.push('restart', options.actions.restart);
        if (options.actions.run) 
            actions.push('run', options.actions.run);
        if (options.actions.reboot) 
            actions.push('reboot', options.actions.reboot);
        if (actions.length > 0)
            addArg(argsOut, 'actions', toSlashSeperated(actions));
    }
    return buildCommand('failure', argsIn.server, argsOut);
}
export function query(args: Args) {
    const argsIn = getArgs(args, 1);
    const argsOut: string[] = [];
    if (argsIn.options.name) argsOut.push(argsIn.options.name);
    else {
        addArg(argsOut, 'type', argsIn.options.class);
        addArg(argsOut, 'type', argsIn.options.type);
        addArg(argsOut, 'state', argsIn.options.state);
        addArg(argsOut, 'group', argsIn.options.group); 
        addArg(argsOut, 'bufsize', 262144);    
    }
    return buildCommand('queryex', argsIn.server, argsOut);
}
function delete_sc(args: Args) {
    return buildSimpleCommand('delete', args, 2);
}
export { delete_sc as delete };
// ********** System *******************
export function setBoot(args: Args) {
    return buildSimpleCommand('boot', args, 2);
}
export function lock(args: Args) {
    return buildSimpleCommand('lock', args, 1);
}
export function getLock(args: Args) {
    return buildSimpleCommand('querylock', args, 1);
}
