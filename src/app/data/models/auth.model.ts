export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginApiResponse {
  token?: string;
  Token?: string;
}
