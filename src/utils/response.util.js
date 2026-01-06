exports.success = (data = null, message = "Success") => {
  return {
    success: true,
    message,
    data,
    error: null
  };
};

exports.error = (message = "Error", error = null) => {
  return {
    success: false,
    message,
    data: null,
    error
  };
};
