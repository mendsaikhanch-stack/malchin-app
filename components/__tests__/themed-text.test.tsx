import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../themed-text';

describe('ThemedText', () => {
  it('renders children text', () => {
    const { getByText } = render(<ThemedText>Сайн байна уу</ThemedText>);
    expect(getByText('Сайн байна уу')).toBeTruthy();
  });

  it('default type-тэй рендер хийнэ', () => {
    const { getByText } = render(<ThemedText>default</ThemedText>);
    const node = getByText('default');
    expect(node).toBeTruthy();
  });

  it('title type-д том фонт харагдана', () => {
    const { getByText } = render(
      <ThemedText type="title">Гарчиг</ThemedText>
    );
    const node = getByText('Гарчиг');
    const styles = Array.isArray(node.props.style)
      ? node.props.style.filter(Boolean)
      : [node.props.style];
    const hasTitleStyle = styles.some(
      (s: any) => s && (s.fontSize === 32 || s.fontWeight === 'bold')
    );
    expect(hasTitleStyle).toBe(true);
  });

  it('link type-д өнгөний бэлэн style-тай', () => {
    const { getByText } = render(
      <ThemedText type="link">Холбоос</ThemedText>
    );
    const node = getByText('Холбоос');
    const styles = Array.isArray(node.props.style)
      ? node.props.style.filter(Boolean)
      : [node.props.style];
    const hasLinkColor = styles.some(
      (s: any) => s && s.color === '#0a7ea4'
    );
    expect(hasLinkColor).toBe(true);
  });
});
