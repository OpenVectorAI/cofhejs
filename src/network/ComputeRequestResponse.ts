import {
  merger,
  splitter,
  to_ascii_str_from_int32,
  to_ascii_str_from_int64,
  to_int32,
  to_int64,
} from './internal/utils.js';

export enum ComputeOperationType {
  UNARY = 0,
  BINARY = 1,
  TERNARY = 2,
}

export enum ComputeOperation {
  DECRYPT = 0,
  REENCRYPT = 1,
  ADD = 2,
  SUBTRACT = 3,
  MULTIPLY = 4,
  DIVIDE = 5,
  LT = 6,
  GT = 7,
  EQ = 8,
  NEQ = 9,
  LTEQ = 10,
  GTEQ = 11,
}

export enum DataType {
  SINGLE = 0,
  TENSOR = 1,
  TENSOR_ID = 2,
}

export enum DataEncryptionType {
  PLAINTEXT = 0,
  CIPHERTEXT = 1,
}

export class ComputeOperationOperand {
  constructor(
    public data_type: DataType,
    public encryption_type: DataEncryptionType,
    public data: Uint8Array,
  ) {}

  to_string(): Uint8Array {
    return merger(
      [
        merger(
          [
            to_ascii_str_from_int32(this.data_type),
            to_ascii_str_from_int32(this.encryption_type),
            to_ascii_str_from_int64(BigInt(this.data.length)),
          ],
          ' ',
        ),
        this.data,
      ],
      '\n',
      true,
    );
  }

  static from_string(str: Uint8Array): ComputeOperationOperand;
  static from_string(
    str: Uint8Array,
    num_operands: number,
  ): ComputeOperationOperand[];
  static from_string(
    str: Uint8Array,
    num_operands?: number,
  ): ComputeOperationOperand | ComputeOperationOperand[] {
    let single_operand = false;
    if (num_operands === undefined) {
      single_operand = true;
      num_operands = 1;
    }
    let remaining_str = str;
    let res: ComputeOperationOperand[] = [];
    for (let i = 0; i < num_operands; i++) {
      const parts = splitter(remaining_str, '\n', 2, false);
      if (parts.length !== 2) {
        throw new Error('Invalid string format');
      }
      const first_line_parts = splitter(parts[0]!, ' ', 3, false);
      if (first_line_parts.length !== 3) {
        throw new Error('Invalid string format');
      }
      const data_type = to_int32(first_line_parts[0]!);
      const encryption_type = to_int32(first_line_parts[1]!);
      const data_size = to_int64(first_line_parts[2]!);
      if (remaining_str.length < Number(data_size)) {
        throw new Error('Data size mismatch');
      }
      const data = parts[1]!.slice(0, Number(data_size));
      res.push(
        new ComputeOperationOperand(
          data_type as DataType,
          encryption_type as DataEncryptionType,
          data,
        ),
      );
      if (i !== num_operands - 1) {
        remaining_str = remaining_str.slice(
          parts[0]!.length + 1 + Number(data_size) + 1,
        );
      }
    }
    if (single_operand) {
      return res[0]!;
    }
    return res;
  }
}

export class ComputeOperationInstance {
  constructor(
    public operation_type: ComputeOperationType,
    public operation: ComputeOperation,
    public operands: ComputeOperationOperand[],
  ) {}

  to_string(): Uint8Array {
    return merger(
      [
        merger(
          [
            to_ascii_str_from_int32(this.operation_type),
            to_ascii_str_from_int32(this.operation),
            to_ascii_str_from_int64(BigInt(this.operands.length)),
          ],
          ' ',
        ),
        ...this.operands.map((operand) => operand.to_string()),
      ],
      '\n',
      true,
    );
  }

  static from_string(str: Uint8Array): ComputeOperationInstance {
    const parts = splitter(str, '\n', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid string format');
    }
    const first_line_parts = splitter(parts[0]!, ' ', 3, false);
    if (first_line_parts.length !== 3) {
      throw new Error('Invalid string format');
    }
    const operation_type = to_int32(first_line_parts[0]!);
    const operation = to_int32(first_line_parts[1]!);
    const num_operands = to_int64(first_line_parts[2]!);
    const operands_str = parts[1]!;
    const operands = ComputeOperationOperand.from_string(
      operands_str,
      Number(num_operands),
    );
    return new ComputeOperationInstance(
      operation_type as ComputeOperationType,
      operation as ComputeOperation,
      operands,
    );
  }
}

export class ComputeRequest {
  constructor(public operation: ComputeOperationInstance) {}

  to_string(): Uint8Array {
    return this.operation.to_string();
  }

  static from_string(str: Uint8Array): ComputeRequest {
    const operation = ComputeOperationInstance.from_string(str);
    return new ComputeRequest(operation);
  }
}

export enum ComputeResponseStatus {
  SUCCESS = 0,
  ERROR = 1,
}

export class ComputeResponse {
  constructor(
    public status: ComputeResponseStatus,
    public data: Uint8Array,
  ) {}

  to_string(): Uint8Array {
    return merger(
      [to_ascii_str_from_int32(this.status), this.data],
      '\n',
      true,
    );
  }

  static from_string(str: Uint8Array): ComputeResponse {
    const parts = splitter(str, '\n', 2, false);
    if (parts.length !== 2) {
      throw new Error('Invalid string format');
    }
    return new ComputeResponse(
      to_int32(parts[0]!) as ComputeResponseStatus,
      parts[1]!,
    );
  }
}
