import Axios from 'axios';
import { API_URL } from '../config';

const apiClient = Axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (Axios.isAxiosError(error) && !error.response) {
      return Promise.reject(
        new Error(
          `Не удалось подключиться к API (${API_URL}). Проверьте, что backend запущен и VITE_API_URL настроен корректно.`
        )
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;
