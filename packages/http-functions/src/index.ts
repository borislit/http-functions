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

export function pipe<TCreator extends (...args: any[]) => any>(
  ...executions: TCreator[]
) {
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
