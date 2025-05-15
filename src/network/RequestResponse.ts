import {
  merger,
  splitter,
  to_ascii_str_from_int32,
  to_ascii_str_from_int64,
  to_int32,
  to_int64,
} from './internal/utils.js';

export enum ProtocolVersion {
  V1 = 0,
}

export enum ServiceType {
  COMPUTE_REQUEST = 0,
  COFHE_REQUEST = 1,
  SETUP_REQUEST = 2,
}

export enum ResponseStatus {
  OK = 0,
  ERROR = 1,
}

export class ResponseHeader {
  constructor(
    private ver_m: ProtocolVersion,
    private type_m: ServiceType,
    private status_m: ResponseStatus,
    private data_size_m: bigint,
  ) {}

  public get protocol_version(): ProtocolVersion {
    return this.ver_m;
  }
  public get type(): ServiceType {
    return this.type_m;
  }
  public get status(): ResponseStatus {
    return this.status_m;
  }
  public get data_size(): bigint {
    return this.data_size_m;
  }

  // doesnt add a newline at end, is added by Response serializer
  to_string(): Uint8Array {
    return merger(
      [
        to_ascii_str_from_int32(this.ver_m),
        to_ascii_str_from_int32(this.type_m),
        to_ascii_str_from_int32(this.status_m),
        to_ascii_str_from_int64(this.data_size_m),
      ],
      ' ',
    );
  }

  static from_string(str: Uint8Array): ResponseHeader {
    const parts = splitter(str, ' ', 4, false);
    if (parts.length !== 4) {
      throw new Error('Invalid ResponseHeader string');
    }
    const ver = to_int32(parts[0]!);
    const type = to_int32(parts[1]!);
    const status = to_int32(parts[2]!);
    const data_size = to_int64(parts[3]!);
    return new ResponseHeader(
      ver as ProtocolVersion,
      type as ServiceType,
      status as ResponseStatus,
      data_size,
    );
  }
}

export class Response {
  constructor(
    private header_m: ResponseHeader,
    private data_m: Uint8Array,
  ) {}

  public get header(): ResponseHeader {
    return this.header_m;
  }
  public get protocol_version(): ProtocolVersion {
    return this.header_m.protocol_version;
  }
  public get type(): ServiceType {
    return this.header_m.type;
  }
  public get status(): ResponseStatus {
    return this.header_m.status;
  }
  public get data_size(): bigint {
    return this.header_m.data_size;
  }
  public get data(): Uint8Array {
    return this.data_m;
  }

  to_string(): Uint8Array {
    return merger([this.header_m.to_string(), this.data_m], '\n');
  }

  static from_string(str: Uint8Array): Response {
    const parts = splitter(str, '\n', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid Response string');
    }
    const header = ResponseHeader.from_string(parts[0]!);
    return new Response(header, parts[1]!);
  }
}

export class RequestHeader {
  constructor(
    private ver_m: ProtocolVersion,
    private type_m: ServiceType,
    private data_size_m: bigint,
  ) {}

  public get protocol_version(): ProtocolVersion {
    return this.ver_m;
  }
  public get type(): ServiceType {
    return this.type_m;
  }
  public get data_size(): bigint {
    return this.data_size_m;
  }

  // doesnt add a newline at end, is added by Request serializer
  to_string(): Uint8Array {
    return merger(
      [
        to_ascii_str_from_int32(this.ver_m),
        to_ascii_str_from_int32(this.type_m),
        to_ascii_str_from_int64(this.data_size_m),
      ],
      ' ',
    );
  }

  static from_string(str: Uint8Array): RequestHeader {
    const parts = splitter(str, ' ', 3, false);
    if (parts.length !== 3) {
      throw new Error('Invalid RequestHeader string');
    }
    const ver = to_int32(parts[0]!);
    const type = to_int32(parts[1]!);
    const data_size = to_int64(parts[2]!);
    return new RequestHeader(
      ver as ProtocolVersion,
      type as ServiceType,
      data_size,
    );
  }
}

export class Request {
  constructor(
    private header_m: RequestHeader,
    private data_m: Uint8Array,
  ) {}

  public get header(): RequestHeader {
    return this.header_m;
  }
  public get protocol_version(): ProtocolVersion {
    return this.header_m.protocol_version;
  }
  public get type(): ServiceType {
    return this.header_m.type;
  }
  public get data_size(): bigint {
    return this.header_m.data_size;
  }
  public get data(): Uint8Array {
    return this.data_m;
  }
  to_string(): Uint8Array {
    return merger([this.header_m.to_string(), this.data_m], '\n');
  }
  static from_string(str: Uint8Array): Request {
    const parts = splitter(str, '\n', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid Request string');
    }
    const header = RequestHeader.from_string(parts[0]!);
    return new Request(header, parts[1]!);
  }
}
