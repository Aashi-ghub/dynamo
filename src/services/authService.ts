import type { User } from '../types';

export const authService = {
  async login(email: string, password: string):Promise<{token: string; user: User}> {
    // In a real implementation this would contact Cognito directly using AWS Amplify or similar,
    // or call a proxy endpoint in API Gateway. We're mocking the success response here
    // for architectural demonstration since the actual Cognito setup is external.
    // 
    // const response = await api.post('/auth/login', { email, password });
    // return response.data;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@example.com' && password === 'password') {
          resolve({
            token: 'mock-jwt-token-12345',
            user: { id: 'u1', name: 'Admin User', email: 'admin@example.com' }
          });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  }
};
