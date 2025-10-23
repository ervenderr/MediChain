import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "./constants";

const TOKEN_KEY = "authToken";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Token expired, clear token
          AsyncStorage.removeItem(TOKEN_KEY);
          // TODO: Navigate to login
        }
        return Promise.reject(error);
      }
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }

  async setToken(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  async clearToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export const apiClient = new ApiClient().instance;
export const apiHelpers = {
  setToken: (token: string) => new ApiClient().setToken(token),
  getToken: () => new ApiClient().getToken(),
  clearToken: () => new ApiClient().clearToken(),
};
