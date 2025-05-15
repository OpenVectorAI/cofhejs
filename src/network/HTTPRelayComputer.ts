import type { Computer } from './ClientNode.js';
import { ComputeRequest, ComputeResponse } from './ComputeRequestResponse.js';
import {
  ProtocolVersion,
  Request,
  RequestHeader,
  Response,
  ResponseStatus,
  ServiceType,
} from './RequestResponse.js';
import { NetworkDetails } from './NetworkDetails.js';
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
import { base64ToUint8Array, uint8ArrayToBase64 } from './internal/utils.js';

enum HTTPComputeResponseStatus {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  INTERNAL_SERVER_ERROR = 500,
}

export class HTTPRelayComputer implements Computer {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  public get usable(): boolean {
    return true;
  }

  async connect() {
    // No connection needed for HTTP relay
  }

  async compute(req_: ComputeRequest): Promise<ComputeResponse> {
    const req = new Request(
      new RequestHeader(
        ProtocolVersion.V1,
        ServiceType.COMPUTE_REQUEST,
        BigInt(req_.to_string().length),
      ),
      req_.to_string(),
    );

    const body = {
      data: uint8ArrayToBase64(req.to_string()),
    };

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const res_json = await response.json();
    if (res_json.status !== HTTPComputeResponseStatus.SUCCESS) {
      throw new Error(`Compute request failed with status: ${res_json.status}`);
    }
    const data_base64 = res_json.data;
    const data = base64ToUint8Array(data_base64);
    const res = Response.from_string(new Uint8Array(data));
    if (res.status !== ResponseStatus.OK) {
      throw new Error(
        `Network details request failed with status: ${res.status}`,
      );
    }
    return ComputeResponse.from_string(res.data);
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
    const req = new Request(
      new RequestHeader(
        ProtocolVersion.V1,
        ServiceType.SETUP_REQUEST,
        BigInt(setup_request.to_string().length),
      ),
      setup_request.to_string(),
    );
    const body = {
      data: uint8ArrayToBase64(req.to_string()),
    };
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const res_json = await response.json();
    if (res_json.status !== HTTPComputeResponseStatus.SUCCESS) {
      throw new Error(
        `Network details request failed with status: ${res_json.status}`,
      );
    }
    const data_base64 = res_json.data;
    const data = base64ToUint8Array(data_base64);
    const res = Response.from_string(new Uint8Array(data));
    if (res.status !== ResponseStatus.OK) {
      throw new Error(
        `Network details request failed with status: ${res.status}`,
      );
    }
    const setup_response = SetupResponse.from_string(res.data);
    if (setup_response.status === SetupResponseStatus.ERROR) {
      throw new Error(
        `Network details request failed with status: ${setup_response.status}`,
      );
    }
    const network_details_response = NetworkDetailsResponse.from_string(
      setup_response.data,
    );

    if (
      network_details_response.status === NetworkDetailsResponseStatus.ERROR
    ) {
      throw new Error(
        `Network details request failed with status: ${network_details_response.status}`,
      );
    }
    return NetworkDetails.from_string(
      new TextDecoder('utf8').decode(network_details_response.data),
    );
  }
}
