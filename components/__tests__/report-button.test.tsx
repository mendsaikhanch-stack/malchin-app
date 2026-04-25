import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ReportButton } from '../report-button';

const mockQueueOnFailure = jest.fn();
const mockQueueChange = jest.fn();
const mockReport = jest.fn();

jest.mock('@/services/sync-queue', () => ({
  queueOnFailure: (...args: unknown[]) => mockQueueOnFailure(...args),
  queueChange: (...args: unknown[]) => mockQueueChange(...args),
}));

jest.mock('@/services/api', () => ({
  lostFoundApi: {
    report: (...args: unknown[]) => mockReport(...args),
  },
}));

beforeEach(() => {
  mockQueueOnFailure.mockReset();
  mockQueueChange.mockReset();
  mockReport.mockReset();
  mockQueueOnFailure.mockResolvedValue({ synced: true });
  mockQueueChange.mockResolvedValue({ id: 'q1' });
});

function pickReasonAndSubmit(getByText: any) {
  fireEvent.press(getByText(/Зөрчил мэдэгдэх/));
  fireEvent.press(getByText('Спам'));
  fireEvent.press(getByText('Илгээх'));
}

describe('ReportButton — kind="lost_found"', () => {
  it('lostFoundApi.report-ыг queueOnFailure-аар wrap хийнэ', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(
      <ReportButton listingId="abc-1" kind="lost_found" />
    );

    pickReasonAndSubmit(getByText);

    await waitFor(() => expect(mockQueueOnFailure).toHaveBeenCalledTimes(1));
    expect(mockQueueChange).not.toHaveBeenCalled();

    const [, fallback] = mockQueueOnFailure.mock.calls[0];
    expect(fallback.table_name).toBe('lost_found_reports');
    expect(fallback.action).toBe('INSERT');
    expect(fallback.data).toEqual({ listing_id: 'abc-1', reason: 'spam' });

    alertSpy.mockRestore();
  });

  it('default kind = lost_found', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(<ReportButton listingId="default-1" />);
    pickReasonAndSubmit(getByText);

    await waitFor(() => expect(mockQueueOnFailure).toHaveBeenCalledTimes(1));
    expect(mockQueueChange).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

describe('ReportButton — kind="market"', () => {
  it('queueChange-руу шууд орно (backend endpoint бэлэн биш)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(
      <ReportButton listingId={42} kind="market" />
    );

    pickReasonAndSubmit(getByText);

    await waitFor(() => expect(mockQueueChange).toHaveBeenCalledTimes(1));
    expect(mockQueueOnFailure).not.toHaveBeenCalled();
    expect(mockReport).not.toHaveBeenCalled();

    const [change] = mockQueueChange.mock.calls[0];
    expect(change.table_name).toBe('market_reports');
    expect(change.action).toBe('INSERT');
    expect(change.data).toEqual({ listing_id: 42, reason: 'spam' });

    alertSpy.mockRestore();
  });
});

describe('ReportButton — UI behaviour', () => {
  it('reason сонгоогүй үед "Илгээх" disabled (queue дуудагдахгүй)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(<ReportButton listingId="x" />);
    fireEvent.press(getByText(/Зөрчил мэдэгдэх/));
    fireEvent.press(getByText('Илгээх')); // reason сонгоогүй

    expect(mockQueueOnFailure).not.toHaveBeenCalled();
    expect(mockQueueChange).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('Submit-ийн дараа onReported callback дуудагдана', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onReported = jest.fn();
    const { getByText } = render(
      <ReportButton listingId="cb-1" kind="lost_found" onReported={onReported} />
    );
    pickReasonAndSubmit(getByText);
    await waitFor(() => expect(onReported).toHaveBeenCalledWith('spam'));
    alertSpy.mockRestore();
  });

  it('compact mode → "Мэдэгдэх" товч + жижиг style', () => {
    const { getByText } = render(<ReportButton listingId="c1" compact />);
    expect(getByText(/Мэдэгдэх/)).toBeTruthy();
  });
});
