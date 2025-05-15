import {
  merger,
  splitter,
  to_ascii_str_from_int32,
  to_ascii_str_from_int64,
  to_int32,
  to_int64,
} from './internal/utils.js';

export enum NetworkDetailsResponseStatus {
  OK = 0,
  ERROR = 1,
}
export class NetworkDetailsResponseHeader {
  constructor(
    private status_m: NetworkDetailsResponseStatus,
    private data_size_m: bigint,
  ) {}

  public get status(): NetworkDetailsResponseStatus {
    return this.status_m;
  }
  public get data_size(): bigint {
    return this.data_size_m;
  }

  // doesnt add a newline at end, is added by NetworkDetailsResponse serializer
  to_string(): Uint8Array {
    return merger(
      [
        to_ascii_str_from_int32(this.status_m),
        to_ascii_str_from_int64(this.data_size_m),
      ],
      ' ',
    );
  }
  static from_string(str: Uint8Array): NetworkDetailsResponseHeader {
    const parts = splitter(str, ' ', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid NetworkDetailsResponseHeader string');
    }
    const status = to_int32(parts[0]!);
    const data_size = to_int64(parts[1]!);
    return new NetworkDetailsResponseHeader(
      status as NetworkDetailsResponseStatus,
      data_size,
    );
  }
}

export class NetworkDetailsResponse {
  constructor(
    private header_m: NetworkDetailsResponseHeader,
    private data_m: Uint8Array,
  ) {
    if (data_m.length !== Number(header_m.data_size)) {
      throw new Error('Data size mismatch');
    }
  }

  public get header(): NetworkDetailsResponseHeader {
    return this.header_m;
  }
  public get status(): NetworkDetailsResponseStatus {
    return this.header.status;
  }
  public get data_size(): bigint {
    return this.header.data_size;
  }
  public get data(): Uint8Array {
    return this.data_m;
  }
  to_string(): Uint8Array {
    return merger([this.header.to_string(), this.data], '\n');
  }
  static from_string(str: Uint8Array): NetworkDetailsResponse {
    const parts = splitter(str, '\n', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid NetworkDetailsResponse string');
    }
    const header = NetworkDetailsResponseHeader.from_string(parts[0]!);
    return new NetworkDetailsResponse(header, parts[1]!);
  }
}

export enum NetworkDetailsRequestType {
  GET = 0,
  SET = 1,
}

export class NetworkDetailsRequestHeader {
  constructor(
    private type_m: NetworkDetailsRequestType,
    private data_size_m: bigint,
  ) {}

  public get type(): NetworkDetailsRequestType {
    return this.type_m;
  }
  public get data_size(): bigint {
    return this.data_size_m;
  }

  // doesnt add a newline at end, is added by NetworkDetailsRequest serializer
  to_string(): Uint8Array {
    return merger(
      [
        to_ascii_str_from_int32(this.type_m),
        to_ascii_str_from_int64(this.data_size_m),
      ],
      ' ',
    );
  }
  static from_string(str: Uint8Array): NetworkDetailsRequestHeader {
    const parts = splitter(str, ' ', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid NetworkDetailsRequestHeader string');
    }
    const type = to_int32(parts[0]!);
    const data_size = to_int64(parts[1]!);
    return new NetworkDetailsRequestHeader(type, data_size);
  }
}

export class NetworkDetailsRequest {
  constructor(
    private header_m: NetworkDetailsRequestHeader,
    private data_m: Uint8Array,
  ) {
    if (data_m.length !== Number(header_m.data_size)) {
      throw new Error('Data size mismatch');
    }
  }

  public get header(): NetworkDetailsRequestHeader {
    return this.header_m;
  }
  public get type(): NetworkDetailsRequestType {
    return this.header.type;
  }
  public get data_size(): bigint {
    return this.header.data_size;
  }
  public get data(): Uint8Array {
    return this.data_m;
  }
  to_string(): Uint8Array {
    return merger([this.header.to_string(), this.data], '\n');
  }
  static from_string(str: Uint8Array): NetworkDetailsRequest {
    const parts = splitter(str, '\n', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid NetworkDetailsRequest string');
    }
    const header = NetworkDetailsRequestHeader.from_string(parts[0]!);
    return new NetworkDetailsRequest(header, parts[1]!);
  }
}

export enum SetupResponseStatus {
  OK = 0,
  ERROR = 1,
}

export class SetupResponseHeader {
  constructor(
    private status_m: SetupResponseStatus,
    private data_size_m: bigint,
  ) {}

  public get status(): SetupResponseStatus {
    return this.status_m;
  }
  public get data_size(): bigint {
    return this.data_size_m;
  }

  // doesnt add a newline at end, is added by SetupResponse serializer
  to_string(): Uint8Array {
    return merger(
      [
        to_ascii_str_from_int32(this.status_m),
        to_ascii_str_from_int64(this.data_size_m),
      ],
      ' ',
    );
  }
  static from_string(str: Uint8Array): SetupResponseHeader {
    const parts = splitter(str, ' ', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid SetupResponseHeader string');
    }
    const status = to_int32(parts[0]!);
    const data_size = to_int64(parts[1]!);
    return new SetupResponseHeader(status as SetupResponseStatus, data_size);
  }
}

export class SetupResponse {
  constructor(
    private header_m: SetupResponseHeader,
    private data_m: Uint8Array,
  ) {
    if (data_m.length !== Number(header_m.data_size)) {
      throw new Error('Data size mismatch');
    }
  }

  public get header(): SetupResponseHeader {
    return this.header_m;
  }
  public get status(): SetupResponseStatus {
    return this.header.status;
  }
  public get data_size(): bigint {
    return this.header.data_size;
  }
  public get data(): Uint8Array {
    return this.data_m;
  }
  to_string(): Uint8Array {
    return merger([this.header.to_string(), this.data], '\n');
  }
  static from_string(str: Uint8Array): SetupResponse {
    const parts = splitter(str, '\n', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid SetupResponse string');
    }
    const header = SetupResponseHeader.from_string(parts[0]!);
    return new SetupResponse(header, parts[1]!);
  }
}

export enum SetupRequestType {
  BEAVERS_TRIPLET_REQUEST = 0,
  COMPARISION_PAIR_REQUEST = 1,
  JOIN_AS_NODE_REQUEST = 2,
  NETWORK_DETAILS_REQUEST = 3,
}

export class SetupRequestHeader {
  constructor(
    private type_m: SetupRequestType,
    private data_size_m: bigint,
  ) {}

  public get type(): SetupRequestType {
    return this.type_m;
  }
  public get data_size(): bigint {
    return this.data_size_m;
  }

  // doesnt add a newline at end, is added by SetupRequest serializer
  to_string(): Uint8Array {
    return merger(
      [
        to_ascii_str_from_int32(this.type_m),
        to_ascii_str_from_int64(this.data_size_m),
      ],
      ' ',
    );
  }
  static from_string(str: Uint8Array): SetupRequestHeader {
    const parts = splitter(str, ' ', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid SetupRequestHeader string');
    }
    const type = to_int32(parts[0]!);
    const data_size = to_int64(parts[1]!);
    return new SetupRequestHeader(type, data_size);
  }
}

export class SetupRequest {
  constructor(
    private header_m: SetupRequestHeader,
    private data_m: Uint8Array,
  ) {
    if (data_m.length !== Number(header_m.data_size)) {
      throw new Error('Data size mismatch');
    }
  }

  public get header(): SetupRequestHeader {
    return this.header_m;
  }
  public get type(): SetupRequestType {
    return this.header.type;
  }
  public get data_size(): bigint {
    return this.header.data_size;
  }
  public get data(): Uint8Array {
    return this.data_m;
  }
  to_string(): Uint8Array {
    return merger([this.header.to_string(), this.data], '\n');
  }
  static from_string(str: Uint8Array): SetupRequest {
    const parts = splitter(str, '\n', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid SetupRequest string');
    }
    const header = SetupRequestHeader.from_string(parts[0]!);
    return new SetupRequest(header, parts[1]!);
  }
}
