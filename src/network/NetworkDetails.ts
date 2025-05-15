import { base64ToUint8Array, uint8ArrayToBase64 } from './internal/utils.js';

export enum NodeType {
  SETUP_NODE = 0,
  CoFHE_NODE = 1,
  COMPUTE_NODE = 2,
  CLIENT_NODE = 3,
}

function node_type_to_string(type: NodeType): string {
  switch (type) {
    case NodeType.SETUP_NODE:
      return 'SETUP_NODE';
    case NodeType.CoFHE_NODE:
      return 'CoFHE_NODE';
    case NodeType.COMPUTE_NODE:
      return 'COMPUTE_NODE';
    case NodeType.CLIENT_NODE:
      return 'CLIENT_NODE';
    default:
      return 'Unknown';
  }
}

function string_to_node_type(type: string): NodeType {
  if (type === 'SETUP_NODE') {
    return NodeType.SETUP_NODE;
  } else if (type === 'CoFHE_NODE') {
    return NodeType.CoFHE_NODE;
  } else if (type === 'COMPUTE_NODE') {
    return NodeType.COMPUTE_NODE;
  } else if (type === 'CLIENT_NODE') {
    return NodeType.CLIENT_NODE;
  } else {
    throw new Error('Invalid node type');
  }
}

export interface NodeDetails {
  ip: string;
  port: string;
  type: NodeType;
}

export enum ReencryptorType {
  RSA = 0,
}

function reencryption_type_to_string(type: ReencryptorType): string {
  switch (type) {
    case ReencryptorType.RSA:
      return 'RSA';
    default:
      return 'Unknown';
  }
}

function string_to_reencryption_type(type: string): ReencryptorType {
  if (type === 'RSA') {
    return ReencryptorType.RSA;
  } else {
    throw new Error('Invalid reencryption type');
  }
}

export interface ReencryptorDetails {
  type: ReencryptorType;
  key_size: number;
}

export enum CryptoSystemType {
  CoFHE_CPU = 0,
}

function cryptosystem_type_to_string(type: CryptoSystemType): string {
  switch (type) {
    case CryptoSystemType.CoFHE_CPU:
      return 'CoFHE_CPU';
    default:
      return 'Unknown';
  }
}

function string_to_cryptosystem_type(type: string): CryptoSystemType {
  if (type === 'CoFHE_CPU') {
    return CryptoSystemType.CoFHE_CPU;
  } else {
    throw new Error('Invalid cryptosystem type');
  }
}

export interface CryptoSystemDetails {
  type: CryptoSystemType;
  public_key: Uint8Array;
  security_level: number;
  k: number;
  threshold: number;
  total_nodes: number;
  N: string;
}

function nCr(n: number, r: number): number {
  if (r > n) {
    return 0;
  }
  if (r === 0 || r === n) {
    return 1;
  }
  let res = 1;
  for (let i = 0; i < r; i++) {
    res *= n - i;
    res /= i + 1;
  }
  return res;
}

export class NetworkDetails {
  constructor(
    private self_node_m: NodeDetails,
    private nodes_m: NodeDetails[],
    private cryptosystem_details_m: CryptoSystemDetails,
    private secret_key_shares_m: Uint8Array[],
    private reencryption_details_m: ReencryptorDetails,
  ) {
    if (self_node_m.type === NodeType.CoFHE_NODE) {
      if (
        nCr(
          cryptosystem_details_m.total_nodes,
          cryptosystem_details_m.threshold,
        ) !== secret_key_shares_m.length
      ) {
        throw new Error('Invalid number of secret key shares');
      }
    }
  }
  public get self_node(): NodeDetails {
    return this.self_node_m;
  }
  public get nodes(): NodeDetails[] {
    return this.nodes_m;
  }
  public get cryptosystem_details(): CryptoSystemDetails {
    return this.cryptosystem_details_m;
  }
  public get secret_key_shares(): Uint8Array[] {
    return this.secret_key_shares_m;
  }
  public get reencryption_details(): ReencryptorDetails {
    return this.reencryption_details_m;
  }
  public to_json(): object {
    return {
      self_node: {
        ip: this.self_node_m.ip,
        port: this.self_node_m.port,
        type: node_type_to_string(this.self_node_m.type),
      },
      nodes: this.nodes_m.map((node) => ({
        ip: node.ip,
        port: node.port,
        type: node_type_to_string(node.type),
      })),
      cryptosystem_details: {
        type: cryptosystem_type_to_string(this.cryptosystem_details_m.type),
        public_key: uint8ArrayToBase64(this.cryptosystem_details_m.public_key),
        security_level: this.cryptosystem_details_m.security_level,
        k: this.cryptosystem_details_m.k,
        threshold: this.cryptosystem_details_m.threshold,
        total_nodes: this.cryptosystem_details_m.total_nodes,
      },
      secret_key_shares: this.secret_key_shares_m.map((share) =>
        uint8ArrayToBase64(share),
      ),
      reencryption_details: {
        type: reencryption_type_to_string(this.reencryption_details_m.type),
        key_size: this.reencryption_details_m.key_size,
      },
    };
  }

  public to_string(): string {
    return JSON.stringify(this.to_json());
  }

  public static from_string(json_dump: string): NetworkDetails {
    const json = JSON.parse(json_dump);
    const self_node: NodeDetails = {
      ip: json.self_node.ip,
      port: json.self_node.port,
      type: string_to_node_type(json.self_node.type),
    };
    const nodes: NodeDetails[] = json.nodes.map((node: any) => ({
      ip: node.ip,
      port: node.port,
      type: string_to_node_type(node.type),
    }));
    const cryptosystem_details: CryptoSystemDetails = {
      type: string_to_cryptosystem_type(json.cryptosystem_details.type),
      public_key: base64ToUint8Array(json.cryptosystem_details.public_key),
      security_level: json.cryptosystem_details.security_level,
      k: json.cryptosystem_details.k,
      threshold: json.cryptosystem_details.threshold,
      total_nodes: json.cryptosystem_details.total_nodes,
      N: json.cryptosystem_details.N,
    };
    let secret_key_shares: Uint8Array[];
    secret_key_shares = json.secret_key_shares.map((share: string) =>
      base64ToUint8Array(share),
    );
    const reencryption_details: ReencryptorDetails = {
      type: string_to_reencryption_type(json.reencryption_details.type),
      key_size: json.reencryption_details.key_size,
    };
    return new NetworkDetails(
      self_node,
      nodes,
      cryptosystem_details,
      secret_key_shares,
      reencryption_details,
    );
  }
}
