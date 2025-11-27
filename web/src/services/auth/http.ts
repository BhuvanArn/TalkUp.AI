import { API_ROUTES } from '../api';
import axiosInstance from '../axiosInstance';

/**
 * @class AuthService
 * Handles authentication-related operations such as user registration, login, and logout.
 */
export default class AuthService {
  /**
   * Registers a new user with the provided credentials.
   * The server sets an HTTP-only cookie containing the JWT.
   *
   * @param username - The username for the new account
   * @param email - The email address associated with the new account
   * @param password - The password for the new account
   * @returns A promise that resolves to a success message
   * @throws Will throw an error if the registration fails
   */
  postRegister = async (
    username: string,
    email: string,
    password: string,
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.post(`${API_ROUTES.auth}/register`, {
      username,
      email,
      password,
    });
    return response.data;
  };

  /**
   * Logs in a user with the provided email and password.
   * The server sets an HTTP-only cookie containing the JWT.
   *
   * @param email - The email address of the user
   * @param password - The password of the user
   * @returns A promise that resolves to a success message
   * @throws Will throw an error if the login fails
   */
  postLogin = async (
    email: string,
    password: string,
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.post(`${API_ROUTES.auth}/login`, {
      email,
      password,
    });
    return response.data;
  };

  /**
   * Logs out the current user by clearing the authentication cookie.
   *
   * @returns A promise that resolves to a success message
   */
  postLogout = async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post(`${API_ROUTES.auth}/logout`);
    return response.data;
  };
}
