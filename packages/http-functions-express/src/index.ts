import * as fs from 'fs';
import * as path from 'path';
import { Writable } from 'stream';
import { toJSON, fromJSON } from 'javascript-serializer';

function inMemoryStream(label, arr) {
  return new Writable({
    write(chunk, encoding, callback) {
      arr.push({ label, chunk: chunk.toString().replace(/\n$/, '') });
      callback(null);
    },
  });
}

export function httpFunctionResult(result, context) {
  return {
    type: 'httpFunctionResult',
    logs: context && context.logs ? context.logs : [],
    result: toJSON(result, context),
  };
}

function defaultContextBuilder(req, res) {
  const logs = [];
  const stdout = inMemoryStream('log', logs);
  const stderr = inMemoryStream('error', logs);
  const aConsole = new console.Console(stdout, stderr);
  return { req, res, console: aConsole, logs, stack: true };
}

const INTERNAL_OPS = ['__ALL__', '__PIPE__'];

function executeFunc(methodPath: string, args, context, files) {
  const [, fileName, methodName] = methodPath.split('/');
  const fn = files[fileName] && files[fileName][methodName];

  if (!fn) {
    context.res
      .status(404)
      .send(httpFunctionResult(new Error('no such method'), context));
  } else if (!Array.isArray(args)) {
    context.res
      .status(400)
      .send(httpFunctionResult(new Error('invalid arguments'), context));
  } else {
    return fn
      .apply(context, fromJSON(args))
      .then(result => {
        if (!context.res.headersSent) {
          return result;
        }
      })
      .catch(result => {
        if (!context.res.headersSent) {
          return result;
        }
      }) as Promise<any>;
  }
}

export function httpFunctions(
  folder,
  test,
  contextBuilder = (req, res) => ({}),
) {
  const files = fs
    .readdirSync(folder)
    .filter(fileName => fileName.match(test))
    .map(fileName => fileName.replace(/\.(js|ts)$/, ''))
    .reduce(
      (obj, fileName) => ({
        ...obj,
        [fileName]: require(path.join(folder, fileName)),
      }),
      {},
    );

  return async (req, res) => {
    const context = {
      ...defaultContextBuilder(req, res),
      ...contextBuilder(req, res),
    };
    if (req.method === 'POST') {
      if (req.body.args.op && INTERNAL_OPS.includes(req.body.args.op)) {
        switch (req.body.args.op) {
          case '__ALL__':
            res.send(await handleAll(req.body.args.args, context, files));
            break;
          case '__PIPE__':
            res.send(await handlePipe(req.body.args.args, context, files));
            break;
          default:
            res
              .status(404)
              .send(httpFunctionResult(new Error('no such method'), context));
        }
      } else {
        executeFunc(req.path, req.body.args, context, files)
          .then(result => res.send(httpFunctionResult(result, context)))
          .catch();
      }
    }
  };
}
async function handleAll(funcs: any[], context, files): Promise<any> {
  return Promise.all(
    funcs.map(op => executeFunc(`/${op.op}`, op.args, context, files)),
  ).then(result => httpFunctionResult(result, context));
}

async function handlePipe(funcs: any[], context, files) {
  const promise = funcs.reduce((acc, current) => {
    return acc.then(prevRes => {
      const execArgs = current.args.length
        ? current.args
        : prevRes
        ? [prevRes]
        : [];
      return executeFunc(`/${current.op}`, execArgs, context, files).then(
        execRes => {
          return execRes;
        },
      );
    });
  }, Promise.resolve());
  await promise.then(result => httpFunctionResult(result, context));
}

