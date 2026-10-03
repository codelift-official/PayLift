import { http, HttpResponse } from 'msw';
import type { ReportSummaryResponse } from '../../api/types';
import { seedStore } from '../seed';

export const reportHandlers = [
  // GET /api/v1/reports/summary
  http.get('/api/v1/reports/summary', async ({ request }) => {
    const url = new URL(request.url);
    const shopID = url.searchParams.get('shopID');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    const summary: ReportSummaryResponse = seedStore.getReportSummary(
      shopID,
      fromDate,
      toDate
    );

    return HttpResponse.json(summary, { status: 200 });
  }),
];
