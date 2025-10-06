export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  username: string;
  subscriptionStatus: 'free' | 'premium';
  subscriptionEndAt?: string | null;
  balanceCents: number;
}
