// RN (jest-expo) project setup — dashboard contract-ийн нэмэлт safety.
// Data-layer fetch* функц нь real API руу эхний оролдлого хийж, алдаа
// гарвал mock-руу унадаг. Jest-expo env fetch polyfill-тэй тул бодит
// network guard байлгахыг хориглоно — тестэд хурдан reject хийлгэнэ.

(global as any).fetch = jest.fn(() =>
  Promise.reject(new Error('test-env: fetch disabled'))
);
