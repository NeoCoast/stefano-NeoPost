export interface SignupInput {
  email: string;
  username: string;
  password: string;
  birthday?: string;
}

export interface SigninInput {
  email: string;
  password: string;
}
