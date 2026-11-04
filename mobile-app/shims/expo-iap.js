const unavailableError = () => {
  const error = new Error(
    'Store purchases are unavailable in Expo Go. Use a NowStack development build.'
  );
  error.code = 'E_EXPO_GO_UNSUPPORTED';
  return error;
};

const fetchProducts = async () => {};
const finishTransaction = async () => {};
const requestPurchase = async () => {
  throw unavailableError();
};

export function useIAP() {
  return {
    connected: false,
    products: [],
    fetchProducts,
    requestPurchase,
    finishTransaction,
  };
}
