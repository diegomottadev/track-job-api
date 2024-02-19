class ApplicationNotExist extends Error {
    status: number;
    name: string;
  
    constructor(message?: string) {
      super(message || 'The applications does not exist. Operation cannot be completed.');
      this.status = 404;
      this.name = 'ApplicationNotExist';
    }
  }

  class ApplicationInUse extends Error {
    status: number;
    name: string;

    constructor(message?: string) {
      super(message || 'There is a application with the same information.');
      this.status = 409;
      this.name = 'ApplicationInUse';
    }
  }
  
  export {   ApplicationNotExist,ApplicationInUse };