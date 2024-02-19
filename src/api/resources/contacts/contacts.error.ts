class ContactNotExist extends Error {
    status: number;
    name: string;
  
    constructor(message?: string) {
      super(message || 'The contact does not exist. Operation cannot be completed.');
      this.status = 404;
      this.name = 'ContactNotExist';
    }
  }

  class ContactInUse extends Error {
    status: number;
    name: string;

    constructor(message?: string) {
      super(message || 'There is a contact with the same information.');
      this.status = 409;
      this.name = 'ContactInUse';
    }
  }
  
  export {   ContactNotExist,ContactInUse };