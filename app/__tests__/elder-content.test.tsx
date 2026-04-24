import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ElderContent from '../elder-content';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: {
    Screen: () => null,
  },
}));

const ELDER_KEY = '@malchin_elder_contributor';

describe('ElderContent opt-in gate', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('default (disabled) opt-in screen харагдана', async () => {
    const { findByText } = render(<ElderContent />);
    expect(await findByText('Ахмад/контент бүтээгч')).toBeTruthy();
    expect(await findByText('Идэвхжүүлэх')).toBeTruthy();
    expect(await findByText(/Role-ээ солих шаардлагагүй/)).toBeTruthy();
  });

  it('"Идэвхжүүлэх" дарахад full dashboard нээгдэнэ', async () => {
    const { findByText, queryByText, getByText } = render(<ElderContent />);
    await findByText('Идэвхжүүлэх');
    fireEvent.press(getByText('Идэвхжүүлэх'));
    // Opt-in hint нуугдана
    await waitFor(() => {
      expect(queryByText('Идэвхжүүлэх')).toBeNull();
    });
    // Flag AsyncStorage-д "true" болно
    const flag = await AsyncStorage.getItem(ELDER_KEY);
    expect(flag).toBe('true');
  });

  it('AsyncStorage-д "true" тавьсан үед opt-in screen алгассан', async () => {
    await AsyncStorage.setItem(ELDER_KEY, 'true');
    const { queryByText } = render(<ElderContent />);
    // Opt-in UI-ийн заавал текст харагдахгүй
    await waitFor(() => {
      expect(queryByText('Идэвхжүүлэх')).toBeNull();
      expect(queryByText(/Role-ээ солих шаардлагагүй/)).toBeNull();
    });
  });

  it('AsyncStorage-д "false" эсвэл хоосон үед opt-in харагдана', async () => {
    await AsyncStorage.setItem(ELDER_KEY, 'false');
    const { findByText } = render(<ElderContent />);
    expect(await findByText('Идэвхжүүлэх')).toBeTruthy();
  });

  it('enabled үед "Capability-г унтраах" button харагдана', async () => {
    await AsyncStorage.setItem(ELDER_KEY, 'true');
    const { findByText } = render(<ElderContent />);
    expect(await findByText('Capability-г унтраах')).toBeTruthy();
  });

  it('disable confirm дараа flag=false + opt-in дахин гарна', async () => {
    await AsyncStorage.setItem(ELDER_KEY, 'true');
    // Alert.alert-г mock хийж confirm callback-ийг auto-дуудна
    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _msg, buttons) => {
        const destructive = buttons?.find((b) => b.style === 'destructive');
        destructive?.onPress?.();
      });

    const { findByText, queryByText } = render(<ElderContent />);
    const disableBtn = await findByText('Capability-г унтраах');
    fireEvent.press(disableBtn);

    await waitFor(async () => {
      const flag = await AsyncStorage.getItem(ELDER_KEY);
      expect(flag).toBe('false');
    });

    // Opt-in screen дахиад гарсан — "Идэвхжүүлэх" button
    expect(await findByText('Идэвхжүүлэх')).toBeTruthy();
    expect(queryByText('Capability-г унтраах')).toBeNull();

    alertSpy.mockRestore();
  });
});
