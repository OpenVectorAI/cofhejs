class FakeCryptoModule {
  getRandomValues(arr: Uint8Array): Uint8Array {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }
}
interface RandomProvider {
  getRandomValues(arr: Uint8Array): Uint8Array;
}
export let randomProvider: RandomProvider = new FakeCryptoModule();
export let secureProviderAvailable = false;
// if in nodejs, use crypto.randomBytes
if (typeof window === 'undefined') {
  try {
    let crypto_ = await import('node:crypto');
    randomProvider = crypto_.webcrypto;
    secureProviderAvailable = true;
  } catch (err) {
    console.error('crypto support is disabled!');
  }
}
// if in browser, use window.crypto.getRandomValues
else {
  let avail_randomProvider = window.crypto;
  if (
    typeof avail_randomProvider.getRandomValues !== 'function' ||
    typeof avail_randomProvider.getRandomValues(new Uint8Array(1)) !== 'object'
  ) {
    console.error('crypto support is disabled! Please use a secure provider.');
  } else {
    randomProvider = avail_randomProvider;
  }
  secureProviderAvailable = true;
}
