import axios from 'axios';
const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(undefined, (err) => {
  if (err.code === 'ECONNRESET' && err.config && !err.config.__isRetryRequest) {
    err.config.__isRetryRequest = true;
    return axiosInstance(err.config);
  }
  return Promise.reject(err);
});

export default axiosInstance;
