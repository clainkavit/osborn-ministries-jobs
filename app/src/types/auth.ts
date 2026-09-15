// Stage 21 section 28.

export interface RegisterInput {
  firstName: string;
  lastName: string;
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  emailOrPhone: string;
  password: string;
}

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetInput {
  newPassword: string;
  confirmPassword: string;
}

/** Discriminated result type so callers must handle both branches. */
export type AuthActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };
