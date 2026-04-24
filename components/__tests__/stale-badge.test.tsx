import React from 'react';
import { render } from '@testing-library/react-native';
import { StaleBadge } from '../stale-badge';

describe('StaleBadge', () => {
  it('fresh state → badge үгүй (null render)', () => {
    const { queryByText } = render(
      <StaleBadge fromCache={false} offline={false} expired={false} />
    );
    expect(queryByText('Оффлайн')).toBeNull();
    expect(queryByText('Хуучирсан')).toBeNull();
  });

  it('offline үед "Оффлайн" badge харагдана', () => {
    const { getByText } = render(
      <StaleBadge fromCache={true} offline={true} expired={false} />
    );
    expect(getByText('Оффлайн')).toBeTruthy();
  });

  it('cache + expired → "Хуучирсан"', () => {
    const { getByText } = render(
      <StaleBadge fromCache={true} offline={false} expired={true} />
    );
    expect(getByText('Хуучирсан')).toBeTruthy();
  });

  it('cache + дотор TTL → badge үгүй', () => {
    const { queryByText } = render(
      <StaleBadge fromCache={true} offline={false} expired={false} />
    );
    expect(queryByText('Хуучирсан')).toBeNull();
    expect(queryByText('Оффлайн')).toBeNull();
  });

  it('offline priority > stale', () => {
    const { getByText, queryByText } = render(
      <StaleBadge fromCache={true} offline={true} expired={true} />
    );
    expect(getByText('Оффлайн')).toBeTruthy();
    expect(queryByText('Хуучирсан')).toBeNull();
  });
});
