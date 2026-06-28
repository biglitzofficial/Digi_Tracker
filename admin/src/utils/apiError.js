export function parseApiError(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((e) => e.message).join('. ');
  }
  if (data?.message && data.message !== 'Validation error') {
    return data.message;
  }
  if (data?.message) {
    return data.message;
  }
  return fallback;
}
