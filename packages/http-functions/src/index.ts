import { deferredCalled } from 'http-functions-transport';

export function all(executions): Promise<any> {
  executions.forEach(exec => {
    exec.cancel();
  });

  const execPrams = executions.map(({ metadata }) => ({
    op: metadata.path,
    args: metadata.args,
  }));

  return deferredCalled('/_functions', '', {
    op: '__ALL__',
    args: execPrams,
  });
}

type Func = (...args: any[]) => any;
interface WithMetadata {
  metadata: any;
}
interface TCreator extends Func, WithMetadata {}

export function pipe<T extends TCreator>(...executions: T[]) {
  const execPrams = executions.map(({ metadata }) => ({
    op: metadata.path,
    args: [],
  }));

  return async (...params: Parameters<typeof executions[0]>) => {
    execPrams[0].args = params;

    return deferredCalled('/_functions', '', {
      op: '__PIPE__',
      args: execPrams,
    });
  };
}
