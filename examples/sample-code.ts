/**
 * Sample TypeScript file for testing code navigation
 */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class UserService {
  private users: Map<string, User> = new Map();

  constructor() {
    console.log('UserService initialized');
  }

  async createUser(name: string, email: string): Promise<User> {
    const user: User = {
      id: this.generateId(),
      name,
      email,
      createdAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  private generateId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// TODO: Add password validation
// FIXME: Implement proper error handling
export async function registerUser(name: string, email: string): Promise<User> {
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  const service = new UserService();
  return service.createUser(name, email);
}
