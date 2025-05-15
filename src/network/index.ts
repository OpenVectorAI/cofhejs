import {
  ComputeOperationType,
  ComputeOperation,
  DataType,
  DataEncryptionType,
  ComputeOperationOperand,
  ComputeOperationInstance,
  ComputeRequest,
  ComputeResponseStatus,
  ComputeResponse,
} from './ComputeRequestResponse.js';
import { NodeType, ReencryptorType, NetworkDetails } from './NetworkDetails.js';
import type {
  CryptoSystemDetails,
  ReencryptorDetails,
} from './NetworkDetails.js';
import {
  ProtocolVersion,
  ServiceType,
  ResponseStatus,
  Response,
  ResponseHeader,
  Request,
} from './RequestResponse.js';
import {
  NetworkDetailsResponseStatus,
  NetworkDetailsResponse,
  NetworkDetailsRequestType,
  NetworkDetailsRequestHeader,
  NetworkDetailsRequest,
  SetupResponseStatus,
  SetupResponse,
  SetupRequestType,
  SetupRequestHeader,
  SetupRequest,
} from './SetupRequestResponse.js';
import { HTTPRelayComputer } from './HTTPRelayComputer.js';
import {
  CPUCryptoSystemRSAReencryptorClientNode,
  make_cpu_crypto_system_rsa_reencryptor_client_node,
} from './CPUCryptoSystemRSAReencryptorClientNode.js';

export {
  ComputeOperationType,
  ComputeOperation,
  DataType,
  DataEncryptionType,
  ComputeOperationOperand,
  ComputeOperationInstance,
  ComputeRequest,
  ComputeResponseStatus,
  ComputeResponse,
  NodeType,
  ReencryptorType,
  NetworkDetails,
  ProtocolVersion,
  ServiceType,
  ResponseStatus,
  Response,
  ResponseHeader,
  Request,
  NetworkDetailsResponseStatus,
  NetworkDetailsResponse,
  NetworkDetailsRequestType,
  NetworkDetailsRequestHeader,
  NetworkDetailsRequest,
  SetupResponseStatus,
  SetupResponse,
  SetupRequestType,
  SetupRequestHeader,
  SetupRequest,
  HTTPRelayComputer,
  CPUCryptoSystemRSAReencryptorClientNode,
  make_cpu_crypto_system_rsa_reencryptor_client_node,
};

export type { CryptoSystemDetails, ReencryptorDetails };

export class NodeJsTCPComputer {
  constructor(
    setup_node_address: string,
    setup_node_port: number,
    keep_alive: boolean = false,
  ) {
    if (typeof window !== 'undefined') {
      throw new Error('NodeJsTCPComputer can only be used in Node.js');
    }
    throw new Error('Shouldnt happen');
  }
}

if (typeof window === 'undefined') {
  const root = (() => eval)()('this');
  const { NodeJsTCPComputer } = await import('./NodeJsTCPComputer.js');
  root.NodeJsTCPComputer = NodeJsTCPComputer;
}
