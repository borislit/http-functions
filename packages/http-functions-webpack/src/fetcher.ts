import { deferredCalled } from 'http-functions-transport';

export function httpFunctionsFetcher(endpoint, fileName, methodName) {
  const fn = (...args) =>
    deferredCalled(endpoint, `${fileName}/${methodName}`, args);

  fn.metadata = {
    path: `${fileName}/${methodName}`,
  };

  return fn;
}
