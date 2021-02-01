import Q from 'q';
import { BuiltCommand } from './sc-command';

export type ItemMapper = (item: any) => Q.Promise<any>;
export type PollingFunction = (command: BuiltCommand) => Q.Promise<any>;
export type SuccessFunction = (result: any) => boolean;

function mapSerial(items: any[], map: ItemMapper) {
    const initial = map(items.shift());
    return items.reduce(function(promise, item) {
        return promise.then(function() { return map(item); });
    }, initial);
}

function mapParallel(items: any[], map: ItemMapper) {
    return Q.all(items.map(map));
}

function pollInternal(promise: Q.Promise<any>, poller: PollingFunction, wait: number, success: SuccessFunction): Q.Promise<any> {
    return promise
        .delay(wait)
        .then(poller)
        .then(function(result) { 
            if (!success(result)) return pollInternal(promise, poller, wait, success); 
        });
}

export function poll(items: BuiltCommand[], wait: number, timeout: number, serial: boolean, initial: PollingFunction, poller: PollingFunction, success: SuccessFunction, timeoutMessage: (result: any) => string) {

    var map = function(item) {
        return pollInternal(initial(item), function() { return poller(item); }, 
            wait, success).timeout(timeout, timeoutMessage(item));
    } as ItemMapper;
    
    return serial ? mapSerial(items, map) : mapParallel(items, map);
};