export function splitter(
  str: Uint8Array,
  delimiter: string,
  maxSplits: number,
  includeDelimiter: boolean,
): Uint8Array[] {
  const result: Uint8Array[] = [];
  let start = 0;
  let splits = 0;

  for (let i = 0; i < str.length; i++) {
    if (str[i] === delimiter.charCodeAt(0)) {
      if (splits < maxSplits - 1) {
        const end = includeDelimiter ? i + 1 : i;
        result.push(str.slice(start, end));
        start = i + 1;
        splits++;
      }
    }
  }

  if (start < str.length) {
    result.push(str.slice(start));
  }

  return result;
}

export function merger(
  str: Uint8Array[],
  delimiter: string,
  add_end_at: boolean = false,
): Uint8Array {
  const totalLength = str.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(
    totalLength + (str.length + (add_end_at ? 0 : -1)) * delimiter.length,
  );
  let offset = 0;

  for (let i = 0; i < str.length; i++) {
    result.set(str[i]!, offset);
    offset += str[i]!.length;
    if (i < str.length - 1 || add_end_at) {
      result.set(new TextEncoder().encode(delimiter), offset);
      offset += delimiter.length;
    }
  }

  return result;
}

export function to_ascii_str_from_int32(num: number): Uint8Array {
  return new TextEncoder().encode(num.toString());
}

export function to_ascii_str_from_int64(num: bigint): Uint8Array {
  return new TextEncoder().encode(num.toString());
}

export function to_int32(str: Uint8Array): number {
  return parseInt(new TextDecoder().decode(str), 10);
}

export function to_int64(str: Uint8Array): bigint {
  return BigInt(new TextDecoder().decode(str));
}

export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let nums: number[] = [];
  for (let i = 0; i < uint8Array.length; i++) {
    nums.push(uint8Array[i]!);
  }
  let binaryString = String.fromCharCode.apply(null, nums);
  return btoa(binaryString);
}

export function base64ToUint8Array(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}
