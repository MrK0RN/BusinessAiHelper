import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // For demonstration, return mock authenticated user
  return {
    user: {
      id: "test_user_123",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      profileImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    isLoading: false,
    isAuthenticated: true,
  };
}
