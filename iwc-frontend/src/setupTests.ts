import '@testing-library/jest-dom';

// TextEncoder/TextDecoder polyfills
class CustomTextEncoder {
  encode(input: string): Uint8Array {
    const arr = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
      arr[i] = input.charCodeAt(i);
    }
    return arr;
  }
}

class CustomTextDecoder {
  decode(input?: Uint8Array): string {
    if (!input) return '';
    return String.fromCharCode.apply(null, Array.from(input));
  }
}

global.TextEncoder = CustomTextEncoder as any;
global.TextDecoder = CustomTextDecoder as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    // Parameters are prefixed with _ to indicate they are intentionally unused
  }

  observe(_target: Element): void {
    // Implementation not needed for tests
  }

  unobserve(_target: Element): void {
    // Implementation not needed for tests
  }

  disconnect(): void {
    // Implementation not needed for tests
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver; 