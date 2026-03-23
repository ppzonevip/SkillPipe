import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    membershipTier: number;
    balance: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      membershipTier: number;
      balance: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    membershipTier: number;
    balance: number;
  }
}
