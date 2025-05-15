export class CoFHEError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoFHEError';
  }
}
export class CoFHEValueError extends CoFHEError {
  constructor(message: string) {
    super(message);
    this.name = 'CoFHEValueError';
  }
}
