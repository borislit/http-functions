const configuration = {
  adapter: null,
};

export function configure({adapter}) {
  configuration.adapter = adapter;
};


export interface TransportAdapter {
  get() {

  }

  add() {

  }

  delete() {

  }

  update() {

  }
}
