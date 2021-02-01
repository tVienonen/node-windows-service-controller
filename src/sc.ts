import * as sc from './sc-command';
import tasklist from './tasklist-command';
import * as scParser from './sc-parser';
import tasklistParser from './tasklist-parser';
import process from './process';
import * as coordinator from './coordinator';
import * as common from './common';

export interface CommonControlMultipleServicesOptions {
    /**
     * Starts services serially. By default services are started in parallel.
     */
    serial?: boolean;
}
export interface CommonControlOptions {
    /**
     * Sets the timeout for this command. Default is 30 seconds.
     * Overrides the global timeout.
     */
    timeout?: number;
}
export interface StartOptions extends CommonControlOptions {
    /**
     * Arguments to pass into the services.
     */
    args?: string[]
}
export type StartOptionsMultpleServices = StartOptions & CommonControlMultipleServicesOptions;
export interface StopOptions extends CommonControlOptions {
    /**
     * Waits for the service process to terminate instead of waiting for the 
     * service(s) to indicate they've stopped. All services hosted by the 
     * service process must be stopped for the process to terminate.
     * This is useful when you need to work with files that are locked
     * by the service process.
     */
    waitForExit?: boolean;
}
export type StopOptionsMultipleServices = StopOptions & CommonControlMultipleServicesOptions;
export interface QueryOptions {
    /**
     * Specifies a service to query.
     */
    name?: string;
 
    /**
     * Specifies what to enumerate and the type. The default type is service.
     */
    class?: 'driver'|'service'|'all';
    
    /**
     * Specifies the type of services or type of drivers to enumerate.
     */
    type?: 'own'|'share'|'interact'|'kernel'|'filesys'|'rec'|'adapt';
 
    /**
     * Specifies the started state of the service for which to enumerate. 
     * The default state is active.
     */
    state?: 'active'|'inactive'|'all';
 
    /**
     * Specifies the service group to enumerate. The default is all groups.
     */
    group?: string;
}
export interface QueryResult {
    /**
     * The name of the service.
     */
    name: string;
    /**
     * The type of service. This member can be one of the following values.
     * - KERNEL_DRIVER = 1
     * - FILE_SYSTEM_DRIVER = 2
     * - WIN32_OWN_PROCESS = 16
     * - WIN32_SHARE_PROCESS = 32
     * - WIN32_OWN_PROCESS + INTERACTIVE_PROCESS = 272
     * - WIN32_SHARE_PROCESS + INTERACTIVE_PROCESS = 288
     */
    type: { 
        code: number; 
        name: string; 
    };
    /**
     * The current state of the service. This member can be one of the following values.
     * - STOPPED = 1
     * - START_PENDING = 2
     * - STOP_PENDING = 3
     * - RUNNING = 4
     * - CONTINUE_PENDING = 5
     * - PAUSE_PENDING = 6
     * - PAUSED = 7
     */
    state: { 
        code: number; 
        name: string;
        running: boolean;
        paused: boolean;
        stopped: boolean;
    };
    /**
     * The error code that the service uses to report an error that 
     * occurs when it is starting or stopping. 
     */
    win32ExitCode: number;
    /**
     * The service-specific error code that the service returns when an error occurs 
     * while the service is starting or stopping.
     */
    serviceExitCode: number;
    /**
     * The checkpoint value that the service increments periodically to report its 
     * progress during a lengthy start, stop, pause, or continue operation.
     */
    checkpoint: number;

    /**
     * The estimated time required for a pending start, stop, pause, or 
     * continue operation, in milliseconds. 
     */
    waitHint: number;

    /**
     * The process identifier of the service.
     */
    pid: number,
    /**
     * If SERVICE_RUNS_IN_SYSTEM_PROCESS, the service runs in a system 
     * process that must always be running.
     */
    flags?: 'RUNS_IN_SYSTEM_PROCESS'
}

export interface GetDependenciesResult {
    /**
     * The name of the service.
     */
    name: string;
    /**
     * The display name of the service.
     */
    displayName: string;

    /**
     * The type of service. This member can be one of the following values.
     * - KERNEL_DRIVER = 1
     * - FILE_SYSTEM_DRIVER = 2
     * - WIN32_OWN_PROCESS = 16
     * - WIN32_SHARE_PROCESS = 32
     * - WIN32_OWN_PROCESS + INTERACTIVE_PROCESS = 272
     * - WIN32_SHARE_PROCESS + INTERACTIVE_PROCESS = 288
     */
    type: { 
        code: 1|2|16|32|272|288;
        name: 'KERNEL_DRIVER'|'FILE_SYSTEM_DRIVER'|'WIN32_OWN_PROCESS'|'WIN32_SHARE_PROCESS'|'WIN32_OWN_PROCESS + INTERACTIVE_PROCESS'|'WIN32_SHARE_PROCESS + INTERACTIVE_PROCESS';
    };
    /**
     * The current state of the service. This member can be one of the following values.
     * - STOPPED = 1
     * - START_PENDING = 2
     * - STOP_PENDING = 3
     * - RUNNING = 4
     * - CONTINUE_PENDING = 5
     * - PAUSE_PENDING = 6
     * - PAUSED = 7
     */
    state: { 
        code: 1|2|3|4|5|6|7;
        name: 'STOPPED'|'START_PENDING'|'STOP_PENDING'|'RUNNING'|'CONTINUE_PENDING'|'PAUSE_PENDING'|'PAUSED';
        running: boolean;
        paused: boolean;
        stopped: boolean;
    },

    /**
     * The error code that the service uses to report an error that 
     * occurs when it is starting or stopping.
     */
    win32ExitCode: number;

    /**
     * The service-specific error code that the service returns when an error occurs 
     * while the service is starting or stopping.
     */
    serviceExitCode: number;

    /**
     * The check-point value that the service increments periodically to report its 
     * progress during a lengthy start, stop, pause, or continue operation.
     */
    checkpoint: number;

    /**
     * The estimated time required for a pending start, stop, pause, or 
     * continue operation, in milliseconds.
     */ 
    waitHint: number;
}

export interface GetConfigResult {
    /**
     * The display name to be used by service control programs to identify the service.
     */
    displayName: string;
 
    /**
     * Names of services or load ordering groups that must start before this service.
     */
    dependencies: string[];
 
    /**
     * If the service type is SERVICE_WIN32_OWN_PROCESS or SERVICE_WIN32_SHARE_PROCESS, 
     * this member is the name of the account that the service process will be logged 
     * on as when it runs. 
     * If the service type is SERVICE_KERNEL_DRIVER or SERVICE_FILE_SYSTEM_DRIVER, this 
     * member is the driver object name (that is, \FileSystem\Rdr or \Driver\Xns) which 
     * the input and output (I/O) system uses to load the device driver.
     */
    serviceStartName: string;
    /**
     * The type of service. This member can be one of the following values.
     * - KERNEL_DRIVER = 1
     * - FILE_SYSTEM_DRIVER = 2
     * - WIN32_OWN_PROCESS = 16
     * - WIN32_SHARE_PROCESS = 32
     * - WIN32_OWN_PROCESS + INTERACTIVE_PROCESS = 272
     * - WIN32_SHARE_PROCESS + INTERACTIVE_PROCESS = 288
     */
    type: GetDependenciesResult['type'];
 
    /**
     * When to start the service. This member can be one of the following values.
     * - BOOT_START = 0
     * - SYSTEM_START = 1
     * - AUTO_START = 2
     * - DEMAND_START = 3
     * - DISABLED = 4
     */
    startType: { 
        code: 0|1|2|3|4;
        name: 'BOOT_START'|'SYSTEM_START'|'AUTO_START'|'DEMAND_START'|'DISABLED';
    };
 
    /**
     * The severity of the error, and action taken, if this service fails 
     * to start. This member can be one of the following values.
     * IGNORE = 0
     * NORMAL = 1
     * SEVERE = 2
     * CRITICAL = 3
     */
    errorControl: { 
        code: 0|1|2|3;
        name: 'IGNORE'|'NORMAL'|'SEVERE'|'CRITICAL';
    };
 
    /**
     * The fully qualified path to the service binary file.
     */
    binPath: string;
    /**
     * The name of the load ordering group to which this service belongs. 
     * If the member is NULL or an empty string, the service does not belong 
     * to a load ordering group.
     */
    loadOrderGroup: string;
 
    /**
     * A unique tag value for this service in the group specified by the 
     * loadOrderGroup parameter.
     */
    tag: number;
}
export interface ServiceFailureConfigurationResult {
    /**
     * The time after which to reset the failure count to zero if 
     * there are no failures, in seconds.
     */
    resetPeriod?: number;
 
    /**
     * The message to be broadcast to server users before rebooting in response 
     * to the SC_ACTION_REBOOT service controller action.
     */
    rebootMessage?: string;
 
    /**
     * The command line of the process for the CreateProcess function to execute 
     * in response to the SC_ACTION_RUN_COMMAND service controller action. This 
     * process runs under the same account as the service.
     */
    commandLine?: string;
    /**
     * Represents an action that the service control manager can perform.
     */
    failureActions?: string;
}
export interface ServiceFailureConfigurationInput {    
    /**
     * Specifies the length of the period (in seconds) with no failures 
     * after which the failure count should be reset to 0. This parameter 
     * must be used in conjunction with the actions= parameter.
     */
    reset?: number;
    /**
     * Specifies the message to be broadcast upon failure of the service.
     */
    reboot?: string;  
    /**
     * Specifies the command line to be run upon failure of the service. For more 
     * information about how to run a batch or VBS file upon failure, see Remarks.
     * 
     * @example command: 'path/to/failure.exe'
     */
    command?: string;
    /**
     * Specifies the failure actions and their delay time (in milliseconds). 
     * The following actions are valid: run, restart, and reboot. This parameter 
     * must be used in conjunction with the reset parameter. Omit this option 
     * to take no action upon failure.
     */
    actions?: {
        restart: number;
        run: number;
        reboot: number;
    };
}

export interface LockInformationResult {
    /**
     * The lock status of the database.
     */
    locked: boolean;
    /**
     * The name of the user who acquired the lock.
     */
    owner: string;
    /**
     * The time since the lock was first acquired, in seconds.
     */
    duration: number;
}
export type SCControlNames = 'paramchange'|'netbindadd'|'netbindremove'|'netbindenable'|'netbinddisable'|'UserDefinedControlB';

function runSc<T>(command: sc.BuiltCommand, successParser?: common.Parser) {
    return process<T>(command, scParser.error, successParser);
}

function runTasklist(command: sc.BuiltCommand) {
    return process(command, x => x, tasklistParser);
}

// *************************** CONTROL ***************************

const PAUSED = 7;
const RUNNING = 4;
const STOPPED = 1;

let timeout: number | { timeout: number } = 30000;
let pollInterval = 1000;

function runPoll(control: sc.BuiltControlCommand, poll: coordinator.PollingFunction, predicate: coordinator.SuccessFunction, errorMessage: (error: any) => string) {
    let resolvedTimeout: number;
    if (timeout != null && typeof timeout !== 'number' && 'timeout' in timeout) {
        resolvedTimeout = timeout.timeout;
    } else {
        resolvedTimeout = timeout;
    }
    return coordinator.poll(
        control.commands, pollInterval, resolvedTimeout, Boolean(control.serial),
        function(command) { return runSc(command); },
        poll, predicate, errorMessage);
}

function runControl(control: sc.BuiltControlCommand, status: typeof PAUSED | typeof RUNNING | typeof STOPPED) {
    return runPoll(control,
        function(command) { return query(control.server, { name: command.service }); },
        function(services) { return services[0].state.code === status; },
        function(command) { return 'Timed out attempting to ' + 
            control.command + ' ' + command.service + '.'; });
}
/**
 * Set global timeout for sc calls
 * @param second timeout in seconds
 */
function setTimeout(second: number) {
    timeout = second * 1000;
}
export { setTimeout as timeout };
/**
 * Set polling interval for command result polling
 * @param second interval in seconds
 */
function setPollInterval(second: number) {
    pollInterval = second * 1000;
}
export { setPollInterval as pollInterval };

/**
 * Starts a service
 * @param serviceName Name of the service to start
 * @param opts Start options to pass to the start function
 */
export function start(serviceName: string, opts?: StartOptions): Q.Promise<void>;
/**
 * Starts services
 * @param serviceNames Array of service names to be started
 * @param opts Start options to pass to the start function
 */
export function start(serviceNames: string[], opts?: StartOptionsMultpleServices): Q.Promise<void>;
/**
 * Starts a service on the specified server
 * @param serverName Name of the server
 * @param serviceName Name of the service to be started
 * @param opts Start options to pass to the start function
 */
export function start(serverName: string|undefined, serviceName: string, opts?: StartOptions): Q.Promise<void>;
/**
 * Starts services on the specified server
 * @param serverName Name of the server
 * @param serviceNames Array of service names to be started
 * @param opts Start options to pass to the start function
 */
export function start(serverName: string|undefined, serviceNames: string[], opts?: StartOptionsMultpleServices): Q.Promise<void>;

export function start(serverName?: any, serviceNames?: any, opts?: any): Q.Promise<void> {
    return runControl(sc.start(arguments), RUNNING);
}
/**
 * Pauses a service
 * @param serviceName Name of the service to be paused
 * @param opts Options for the pause command
 */
export function pause(serviceName: string, opts?: CommonControlOptions): Q.Promise<void>;
/**
 * Pauses many services
 * @param serviceNames Name of the services to be paused
 * @param opts Options for the pause command
 */
export function pause(serviceNames: string[], opts?: CommonControlMultipleServicesOptions): Q.Promise<void>;
/**
 * Pauses a service on a server
 * @param serverName Name of the server where to pause the service
 * @param serviceName Name of the service to be paused
 * @param opts Options for the pause command
 */
export function pause(serverName: string|undefined, serviceName: string, opts?: CommonControlOptions): Q.Promise<void>;
/**
 * Pauses many services on a server
 * @param serverName Name of the server where to pause the service
 * @param serviceNames Names of the services to be paused
 * @param opts Options for the pause commmand
 */
export function pause(serverName: string|undefined, serviceNames: string[], opts?: CommonControlMultipleServicesOptions): Q.Promise<void>;
export function pause(serverName?: any, serviceNames?: any, opts?: any): Q.Promise<void> {
    return runControl(sc.pause(arguments), PAUSED);
}
/**
 * Continues a paused service
 * @param serviceName Name of the service to be continued
 * @param opts Options for the continue command
 */
function continue_sc(serviceName: string, opts?: CommonControlOptions): Q.Promise<void>;
/**
 * Continues many paused services
 * @param serviceNames Names of the services to be continued
 * @param opts Options for the continue command
 */
function continue_sc(serviceNames: string[], opts?: CommonControlMultipleServicesOptions): Q.Promise<void>;
/**
 * Continues a service on a server
 * @param serverName Name of the server where to continue a service
 * @param serviceName Name of the service to be continued
 * @param opts Options for the continue command
 */
function continue_sc(serverName: string|undefined, serviceName: string, opts: CommonControlOptions): Q.Promise<void>;
/**
 * Continues many services on a server
 * @param serverName Name of the server where to continue many services
 * @param serviceNames Names of the services to be continued
 * @param opts Options for the continue command
 */
function continue_sc(serverName: string|undefined, serviceNames: string[], opts: CommonControlMultipleServicesOptions): Q.Promise<void>;
function continue_sc(serverName?: any, serviceNames?: any, opts?: any): Q.Promise<void> {
    return runControl(sc.continue(arguments), RUNNING);
}
export { continue_sc as continue };
/**
 * Stops a service
 * @param serviceName Name of the service to stop
 * @param opts Options for the stop command
 */
export function stop(serviceName: string, opts?: StopOptions): Q.Promise<void>;
/**
 * Stops many services
 * @param serviceNames Names of the services to be stopped
 * @param opts Options for the stop command
 */
export function stop(serviceNames: string[], opts?: StopOptionsMultipleServices): Q.Promise<void>;
/**
 * Stops a service on a server
 * @param serverName Name of the server where the service will be stopped
 * @param serviceName Name of the service to stop
 * @param opts Options for the stop command
 */
export function stop(serverName: string|undefined, serviceName: string, opts?: StopOptions): Q.Promise<void>;
/**
 * Stops many services on a server
 * @param serverName Name of the server where the service will be stopped
 * @param serviceNames Name of the services to be stopped
 * @param opts Options for the stop command
 */
export function stop(serverName: string|undefined, serviceNames: string[], opts?: StopOptionsMultipleServices): Q.Promise<void>;
export function stop(serverName: any, serviceNames: any, opts?: any): Q.Promise<void> {
    const command = sc.stop(arguments);
    if (!command.waitForExit) return runControl(command, STOPPED);
    return runPoll(command,
        function(command) { return runTasklist(tasklist(command.service, command.server)); },
        function(processes) { return processes.length == 0; },
        function(command) { return 'Timed out waiting for the ' + 
            command.service + ' service process to terminate.'; });
}
/**
 * Sends a control to a service
 * @param serviceName Name of the service where to send the control
 * @param controlName Name of the control to send
 */
export function control(serviceName: string, controlName: SCControlNames): Q.Promise<void>;
/**
 * Sends a control to a service on a server
 * @param serverName The name of the server where the service resides
 * @param serviceName Name of the services where to send the control
 * @param controlName Name of the control to send
 */
export function control(serverName: string|undefined, serviceName: string, controlName: SCControlNames): Q.Promise<void>;
export function control(serverName?: any, serviceName?: any, controlName?: SCControlNames): Q.Promise<void> {
    return runSc(sc.control(arguments));
}
/**
 * Sends an INTERROGATE control request to a service
 * @param serviceName Name of the service where to send the interrogate request
 */
export function interrogate(serviceName: string): Q.Promise<void>;
/**
 * Sends an INTERROGATE control request to a service on a server
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service where to send the interrogate request
 */
export function interrogate(serverName: string|undefined, serviceName: string): Q.Promise<void>;
export function interrogate(serverName?: any, serviceName?: string): Q.Promise<void> {
    return runSc(sc.interrogate(arguments));
}

// *************************** MANAGEMENT ***************************
/**
 * Create a service
 * @param serviceName Name of the service to be created
 * @param opts Options for the create command
 */
export function create(serviceName: string, opts: sc.CreateCommandOptions): Q.Promise<void>;
/**
 * Create a service on a server
 * @param serverName Name of the server for where to create the service
 * @param serviceName Name of the service to be created
 * @param opts Options for the create command
 */
export function create(serverName: string|undefined, serviceName: string, opts: sc.CreateCommandOptions): Q.Promise<void>;
export function create(serverName?: any, serviceName?: any, opts?: any): Q.Promise<void> {
    return runSc(sc.create(arguments));
}
/**
 * Gets the display name associated with a particular service.
 * @param serviceName Name of the service
 */
export function getDisplayName(serviceName: string): Q.Promise<string>;
/**
 * Gets the display name associated with a particular service on a server.
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service
 */
export function getDisplayName(serverName: string|undefined, serviceName: string): Q.Promise<string>;
export function getDisplayName(serverName?: any, serviceName?: any): Q.Promise<string> {
    return runSc(sc.getDisplayName(arguments), scParser.displayName);
}
/**
 * Gets the key name associated with a particular service, using the display name as input
 * @param displayName Display name of the service 
 */
export function getKeyName(displayName: string): Q.Promise<string>;
/**
 * Gets the key name associated with a particular service on a server, using the display name as input
 * @param serverName Name of the server where the service resides
 * @param displayName Display name of the service
 */
export function getKeyName(serverName: string|undefined, displayName: string): Q.Promise<string>;
export function getKeyName(serverName?: any, serviceName?: any): Q.Promise<string> {
    return runSc(sc.getKeyName(arguments), scParser.keyName);
}
/**
 * Gets the description string of a service
 * @param serviceName Name of the service where the description will be fetched
 */
export function getDescription(serviceName: string): Q.Promise<string>;
/**
 * Gets the description string of a service on a server
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service where the description will be fetched
 */
export function getDescription(serverName: string|undefined, serviceName: string): Q.Promise<string>;
export function getDescription(serverName?: any, serviceName?: any): Q.Promise<string> {
    return runSc(sc.getDescription(arguments), scParser.description);
}
/**
 * Sets the description string for a service
 * @param serviceName Name of the service where the description will be set
 * @param description The description to be set
 */
export function setDescription(serviceName: string, description: string): Q.Promise<void>;
/**
 * Sets the description string for a service on a server
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service where the description will be set
 * @param description The description to be set
 */
export function setDescription(serverName: string|undefined, serviceName: string, description: string): Q.Promise<void>;
export function setDescription(serverName?: any, serviceName?: any, description?: string): Q.Promise<void> {
    return runSc(sc.setDescription(arguments));
}
/**
 * Enumerates the services that cannot run unless the specified service is running
 * @param serviceName Name of the service
 */
export function getDependencies(serviceName: string): Q.Promise<GetDependenciesResult[]>;
/**
 * Enumerates the services that cannot run unless the specified service is running
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service
 */
export function getDependencies(serverName: string|undefined, serviceName: string): Q.Promise<GetDependenciesResult[]>;
export function getDependencies(serverName?: any, serviceName?: any): Q.Promise<GetDependenciesResult[]> {
    return runSc(sc.getDependencies(arguments), scParser.services);
}
/**
 * Gets a service's security descriptor using SDDL
 * @param serviceName Name of the service
 */
export function getDescriptor(serviceName: string): Q.Promise<string>;
/**
 * Gets a service's security descriptor using SDDL
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service
 */
export function getDescriptor(serverName: string|undefined, serviceName: string): Q.Promise<string>;
export function getDescriptor(serverName?: any, serviceName?: any): Q.Promise<string> {
    return runSc(sc.getDescriptor(arguments), scParser.descriptor);
}
/**
 * Sets a service's security descriptor using Service Descriptor Definition Language (SDDL)
 * @param serviceName Name of the service
 * @param descriptor Descriptor string defined with the SDDL spec
 */
export function setDescriptor(serviceName: string, descriptor: string): Q.Promise<void>;
/**
 * Sets a service's security descriptor using Service Descriptor Definition Language (SDDL)
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service
 * @param descriptor Descriptor string defined with the SDDL spec
 */
export function setDescriptor(serverName: string|undefined, serviceName: string, descriptor: string): Q.Promise<void>;
export function setDescriptor(serverName?: any, serviceName?: any, descriptor?: string): Q.Promise<void> {
    return runSc(sc.setDescriptor(arguments));
}
/**
 * Gets the configuration information for a service.
 * @param serviceName Name of the service
 */
export function getConfig(serviceName: string): Q.Promise<GetConfigResult>;
/**
 * Gets the configuration information for a service.
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service
 */
export function getConfig(serverName: string|undefined, serviceName: string): Q.Promise<GetConfigResult>;
export function getConfig(serverName?: any, serviceName?: any): Q.Promise<GetConfigResult> {
    return runSc(sc.getConfig(arguments), scParser.config);
}
/**
 * Modifies the value of a service's entries in the registry and in the Service Control Manager's database.
 * @param serviceName Name of the service
 * @param config The config for the service
 */
export function setConfig(serviceName: string, config: sc.CreateCommandOptions): Q.Promise<void>;
/**
 * Modifies the value of a service's entries in the registry and in the Service Control Manager's database.
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service
 * @param config The config for the service
 */
export function setConfig(serverName: string|undefined, serviceName: string, config: sc.CreateCommandOptions): Q.Promise<void>;
export function setConfig(serverName?: any, serviceName?: any, config?: sc.CreateCommandOptions): Q.Promise<void> {
    return runSc(sc.setConfig(arguments));
}
/**
 * Gets the actions that will be performed if the specified service fails.
 * 
 * The service failure configuration is passed when the promise is resolved. For more information about this data structure see {@link http://msdn.microsoft.com/en-us/library/windows/desktop/ms685939(v=vs.85).aspx here}.
 * @param serviceName Name of the service
 */
export function getFailureConfig(serviceName: string): Q.Promise<ServiceFailureConfigurationResult>;
/**
 * Gets the actions that will be performed if the specified service fails.
 * 
 * The service failure configuration is passed when the promise is resolved. For more information about this data structure see {@link http://msdn.microsoft.com/en-us/library/windows/desktop/ms685939(v=vs.85).aspx here}.
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service
 */
export function getFailureConfig(serverName: string|undefined, serviceName: string): Q.Promise<ServiceFailureConfigurationResult>;
export function getFailureConfig(serverName?: any, serviceName?: any): Q.Promise<ServiceFailureConfigurationResult> {
    return runSc(sc.getFailureConfig(arguments), scParser.failureConfig);
}
/**
 * Specifies what action to take upon failure of the service.
 * @param serviceName Name of the service
 * @param failureConfig Failure config to set for the service
 */
export function setFailureConfig(serviceName: string, failureConfig: ServiceFailureConfigurationInput): Q.Promise<void>;
/**
 * Specifies what action to take upon failure of the service.
 * @param serverName Name of the server
 * @param serviceName Name of the service
 * @param failureConfig Failure config to set for the service
 */
export function setFailureConfig(serverName: string|undefined, serviceName: string, failureConfig: ServiceFailureConfigurationInput): Q.Promise<void>;
export function setFailureConfig(serverName?: any, serviceName?: any, failureConfig?: any): Q.Promise<void> {
    return runSc(sc.setFailureConfig(arguments));
}
/**
 * Enumerates services.
 * @param opts Options for the query command
 */
export function query(opts?: QueryOptions): Q.Promise<QueryResult[]>;
/**
 * Enumerates services.
 * @param server Name of the server where the services reside
 * @param opts Options for the query command
 */
export function query(server: string|undefined, opts?: QueryOptions): Q.Promise<QueryResult[]>;
export function query(server?: any, opts?: any): Q.Promise<QueryResult[]> {
    return runSc(sc.query(arguments), scParser.services);
};
/**
 * Deletes a service subkey from the registry. If the service is running or if another process has an open handle to the service, then the service is marked for deletion.
 * @param serviceName Name of the service
 */
function delete_sc(serviceName: string): Q.Promise<void>;
/**
 * Deletes a service subkey from the registry. If the service is running or if another process has an open handle to the service, then the service is marked for deletion.
 * @param serverName Name of the server where the service resides
 * @param serviceName Name of the service
 */
function delete_sc(serverName: string|undefined, serviceName: string): Q.Promise<void>;
function delete_sc(serverName?: any, serviceName?: any): Q.Promise<void> {
    return runSc(sc.delete(arguments));
}
export { delete_sc as delete };

// *************************** SYSTEM ***************************
/**
 * Specifies whether the last boot was bad or whether it should be saved as the last-known-good boot configuration.
 * @param bootStatus Status of the boot was it ok or bad boot.
 */
export function setBoot(bootStatus: 'ok'|'bad'): Q.Promise<void>;
/**
 * Specifies whether the last boot was bad or whether it should be saved as the last-known-good boot configuration.
 * @param serverName Name of the server
 * @param bootStatus Status of the boot was it ok or bad boot.
 */
export function setBoot(serverName: string|undefined, bootStatus: 'ok'|'bad'): Q.Promise<void>;
export function setBoot(serverName?: any, bootStatus?: any): Q.Promise<void> {
    return runSc(sc.setBoot(arguments));
}
/**
 * Locks the Service Control Manager's database.
 */
export function lock(): Q.Promise<void>;
/**
 * Locks the Service Control Manager's database.
 * @param serverName Name of the server
 */
export function lock(serverName: string|undefined): Q.Promise<void>;
export function lock(serverName?: any): Q.Promise<void> {
    return runSc(sc.lock(arguments));
}
/**
 * Gets the lock status for the Service Control Manager's database.
 */
export function getLock(): Q.Promise<LockInformationResult>;
/**
 * Gets the lock status for the Service Control Manager's database.
 * @param serverName Name of the server
 */
export function getLock(serverName: string|undefined): Q.Promise<LockInformationResult>;
export function getLock(serverName?: any): Q.Promise<LockInformationResult> {
    return runSc(sc.getLock(arguments), scParser.lock);
}