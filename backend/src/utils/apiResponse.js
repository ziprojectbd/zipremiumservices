export function success(data, message) {
  return { success: true, data, message };
}

export function error(message, code) {
  return { success: false, error: message, code };
}

export function paginated(data, total, page, limit) {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
