import net from 'node:net';
import tls from 'node:tls';
import type { Computer } from './ClientNode.js';
import { ComputeRequest, ComputeResponse } from './ComputeRequestResponse.js';
import {
  ProtocolVersion,
  Request,
  RequestHeader,
  Response,
  ResponseHeader,
  ServiceType,
} from './RequestResponse.js';
import { NetworkDetails, NodeType } from './NetworkDetails.js';
import {
  NetworkDetailsRequest,
  NetworkDetailsRequestHeader,
  NetworkDetailsRequestType,
  NetworkDetailsResponse,
  NetworkDetailsResponseStatus,
  SetupRequest,
  SetupRequestHeader,
  SetupRequestType,
  SetupResponse,
  SetupResponseStatus,
} from './SetupRequestResponse.js';

export class NodeJsTCPComputer implements Computer {
  private setup_node_address: string;
  private setup_node_port: number;
  private compute_node_address: string | null = null;
  private compute_node_port: number | null = null;
  private compute_client: net.Socket | null = null;
  private keep_alive: boolean = false;
  private usable_m: boolean = false;

  constructor(
    setup_node_address: string,
    setup_node_port: number,
    keep_alive: boolean = false,
  ) {
    if (typeof window !== 'undefined') {
      throw new Error('NodeJsTCPComputer can only be used in Node.js');
    }
    this.setup_node_address = setup_node_address;
    this.setup_node_port = setup_node_port;
    this.keep_alive = keep_alive;
  }

  public get usable(): boolean {
    return this.usable_m;
  }

  async connect() {
    const network_details = await this.fetch_network_details();
    for (const node of network_details.nodes) {
      if (node.type === NodeType.COMPUTE_NODE) {
        this.compute_node_address = node.ip;
        this.compute_node_port = Number(node.port);
        break;
      }
    }
    if (this.compute_node_address === null || this.compute_node_port === null) {
      throw new Error('No compute node found in network details');
    }
    this.usable_m = true;
  }

  async compute(req_: ComputeRequest): Promise<ComputeResponse> {
    if (this.usable_m === false) {
      throw new Error('NodeJsTCPComputer is not connected');
    }

    if (this.compute_node_address === null || this.compute_node_port === null) {
      throw new Error('Compute node address and port are not set');
    }

    const req = new Request(
      new RequestHeader(
        ProtocolVersion.V1,
        ServiceType.COMPUTE_REQUEST,
        BigInt(req_.to_string().length),
      ),
      req_.to_string(),
    );

    this.compute_client = tls.connect(
      this.compute_node_port!,
      this.compute_node_address!,
      {
        rejectUnauthorized: false,
      },
      () => {
        this.compute_client!.write(req.to_string());
      },
    );
    if (this.compute_client === null) {
      throw new Error('Compute client is null');
    }

    return new Promise((resolve, reject) => {
      this.compute_client!.on('data', (data) => {
        let responseData = new Uint8Array(data.length);
        responseData.set(data, 0);
        const newlineIndex = responseData.indexOf('\n'.charCodeAt(0));
        if (newlineIndex === -1) {
          return;
        }
        const header_data = responseData.slice(0, newlineIndex);
        responseData = responseData.slice(newlineIndex + 1);
        if (header_data.length === 0) {
          return reject(new Error('Empty header data'));
        }
        const response_header = ResponseHeader.from_string(header_data);
        const response_length = Number(response_header.data_size);
        const response_buffer = this.compute_client!.read(
          response_length - responseData.length,
        );
        if (response_buffer !== null) {
          const newResponseData = new Uint8Array(
            response_buffer.length + responseData.length,
          );
          newResponseData.set(responseData, 0);
          newResponseData.set(response_buffer, responseData.length);
          responseData = newResponseData;
        }
        if (responseData.length !== Number(response_header.data_size)) {
          return reject(new Error('Response data length mismatch'));
        }
        const response = new Response(response_header, responseData);
        if (this.keep_alive === false) {
          this.compute_client!.end();
        }
        return resolve(ComputeResponse.from_string(response.data));
      });

      this.compute_client!.on('end', () => {
        if (this.keep_alive === false) {
          this.compute_client!.destroy();
          this.compute_client = null;
        }
      });

      this.compute_client!.on('error', (err) => {
        reject(err);
      });
    });
  }

  async fetch_network_details(): Promise<NetworkDetails> {
    const network_details_request = new NetworkDetailsRequest(
      new NetworkDetailsRequestHeader(NetworkDetailsRequestType.GET, BigInt(0)),
      new Uint8Array(),
    );
    const setup_request = new SetupRequest(
      new SetupRequestHeader(
        SetupRequestType.NETWORK_DETAILS_REQUEST,
        BigInt(network_details_request.to_string().length),
      ),
      network_details_request.to_string(),
    );
    const setup_node = tls.connect(
      this.setup_node_port,
      this.setup_node_address,
      {
        rejectUnauthorized: false,
      },
      () => {
        const req = new Request(
          new RequestHeader(
            ProtocolVersion.V1,
            ServiceType.SETUP_REQUEST,
            BigInt(setup_request.to_string().length),
          ),
          setup_request.to_string(),
        );
        const x = req.to_string();
        setup_node.write(req.to_string());
      },
    );
    return new Promise((resolve, reject) => {
      let responseData = new Uint8Array();
      setup_node.on('data', (data) => {
        let newResponseData = new Uint8Array(data.length + responseData.length);
        newResponseData.set(responseData, 0);
        newResponseData.set(data, responseData.length);
        responseData = newResponseData;
        const newlineIndex = responseData.indexOf('\n'.charCodeAt(0));
        if (newlineIndex === -1) {
          return;
        }
        const header_data = responseData.slice(0, newlineIndex);
        responseData = responseData.slice(newlineIndex + 1);
        if (header_data.length === 0) {
          return reject(new Error('Empty header data'));
        }
        const response_header = ResponseHeader.from_string(header_data);
        const response_length = Number(response_header.data_size);
        const response_buffer = setup_node.read(
          response_length - responseData.length,
        );
        if (response_buffer !== null) {
          newResponseData = new Uint8Array(
            response_buffer.length + responseData.length,
          );
          newResponseData.set(responseData, 0);
          newResponseData.set(response_buffer, responseData.length);
          responseData = newResponseData;
        }
        if (responseData.length !== Number(response_header.data_size)) {
          return reject(new Error('Response data length mismatch'));
        }
        const response = new Response(response_header, responseData);
        const setup_request_response = SetupResponse.from_string(response.data);
        if (setup_request_response.status == SetupResponseStatus.ERROR) {
          return reject(new Error('Error in setup request response'));
        }
        const network_details_request_response =
          NetworkDetailsResponse.from_string(setup_request_response.data);
        if (
          network_details_request_response.status ==
          NetworkDetailsResponseStatus.ERROR
        ) {
          return reject(new Error('Error in network details request response'));
        }
        return resolve(
          NetworkDetails.from_string(
            new TextDecoder('utf8').decode(
              network_details_request_response.data,
            ),
          ),
        );
      });

      setup_node.on('error', (err) => {
        reject(err);
      });
    });
  }
}
