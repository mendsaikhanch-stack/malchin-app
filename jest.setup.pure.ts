// Pure project (node env) setup — RN-тусгай модулиудыг stub-аар солино.
// Зөвхөн `services/api.ts` import chain-ийн ачаар pure тест-д
// AsyncStorage чигээр ороод үхэх тохиолдлыг урьдчилан сэргийлнэ.

// RN-ийн __DEV__ global-ийг node env-д тохируулна
(globalThis as any).__DEV__ = true;

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    default: {
      getItem: jest.fn((k: string) => Promise.resolve(store[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        store[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete store[k];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        for (const k of Object.keys(store)) delete store[k];
        return Promise.resolve();
      }),
    },
  };
});
