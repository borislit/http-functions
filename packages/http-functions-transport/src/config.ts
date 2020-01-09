import { DefaultTransportAdapter } from './default-transport';
import { TransportAdapter } from '.';

const configuration = {
  transpotAdapter: new DefaultTransportAdapter(),
};

export function configure({ adapter }) {
  configuration.transpotAdapter = adapter;
}

export function getTransportAdapter(): TransportAdapter {
  return configuration.transpotAdapter;
}
