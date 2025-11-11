// Test TypeScript file
export class TestClass {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  public getValue(): number {
    return this.value;
  }

  public setValue(newValue: number): void {
    this.value = newValue;
  }
}

export function testFunction(input: string): string {
  return input.toUpperCase();
}
