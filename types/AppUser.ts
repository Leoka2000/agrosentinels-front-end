export interface AppUser {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  password?: string; // Optional since you might not want to expose this everywhere
  verificationCode?: string | null;
  verificationCodeExpiresAt?: Date | null;
  authorities?: string[];
  accountNonLocked?: boolean;
  credentialsNonExpired?: boolean;
  accountNonExpired?: boolean;
}