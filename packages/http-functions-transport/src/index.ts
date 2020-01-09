import { getTransportAdapter } from './config';
import { toJSON, fromJSON } from 'javascript-serializer';
import { parse as parseAnsiColor } from 'ansicolor';

export { DefaultTransportAdapter } from './default-transport';
export { getTransportAdapter, configure } from './config';

function colorize(str) {
  const args = parseAnsiColor(str).asChromeConsoleLogArguments;
  if (args.length === 2 && args[1] === '') {
    return [str];
  } else {
    return args;
  }
}

export function parse(data, path) {
  if (data.type === 'httpFunctionResult') {
    if (data.logs.length > 0) {
      console.groupCollapsed(`http function ${path}`);
      data.logs.forEach(log => {
        console[log.label](...colorize(log.chunk));
      });
      console.groupEnd();
    }
    return fromJSON(data.result);
  } else {
    return data;
  }
}

export function deferredCalled(endpoint, path, args) {
  let timer;
  const adapter = getTransportAdapter();

  const promise = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      adapter
        .execute(endpoint, path, { args: toJSON(args) })
        .then(data => resolve(parse(data, path)))
        .catch(e => reject(parse(e, path)));
    }, 0);
  });

  (promise as any).cancel = () => clearTimeout(timer);
  (promise as any).metadata = { path, args: toJSON(args) };

  return promise;
}

export interface TransportAdapter {
  execute(baseUrl: string, path: string, args): Promise<any>;
}
