export async function fetch_class_bound_from_addon_service(url: string) {
  const body = {
    type: 'get_cl_delta_k_class_number_bound',
    data: '',
  };
  const response = await fetch(url, {
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
  if (res_json.status !== 200) {
    throw new Error(`Addon service error! status: ${res_json.status}`);
  }
  const data = res_json.data;
  const class_bound = BigInt(data);
  if (class_bound <= 0n) {
    throw new Error(`Invalid class bound: ${class_bound}`);
  }
  return class_bound;
}
