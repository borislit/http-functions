import { TransportAdapter } from './index';

export class DefaultTransportAdapter implements TransportAdapter {
  execute(baseUrl, path, args) {
    return new Promise(function(resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          let data;
          if (
            (xhr.getResponseHeader('Content-Type') || '').indexOf('json') === -1
          ) {
            data = xhr.responseText;
          } else {
            data = JSON.parse(xhr.responseText);
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      };

      xhr.onerror = function(e) {
        reject(e);
      };

      xhr.withCredentials = true;
      xhr.open('POST', `${baseUrl}/${path}`, true);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(args));
    });
  }
}
