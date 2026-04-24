// Pure project (node env) setup — RN-тусгай зөвхөн __DEV__ global-ийг
// тохируулна. AsyncStorage нь `moduleNameMapper` дамжуулан official
// `async-storage-mock.js`-руу зураглагддаг.

(globalThis as any).__DEV__ = true;
