import { APIRequestContext, expect } from '@playwright/test';

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async get(url: string) {
    const response = await this.request.get(url);
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async post(url: string, data: any) {
    const response = await this.request.post(url, { data });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async put(url: string, data: any) {
    const response = await this.request.put(url, { data });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async delete(url: string) {
    const response = await this.request.delete(url);
    expect(response.ok()).toBeTruthy();
    return response.json();
  }
}
