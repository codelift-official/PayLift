import { http, HttpResponse } from 'msw';
import type {
  BusinessesResponse,
  BusinessResponse,
  CreateBusinessRequest,
} from '../../api/types';
import { seedStore } from '../seed';

export const businessHandlers = [
  // POST /api/v1/businesses/setup
  http.post('/api/v1/businesses/setup', async ({ request }) => {
    const body = (await request.json()) as CreateBusinessRequest;
    seedStore.business.name = body.name;
    seedStore.business.slug = body.slug;
    seedStore.business.gst = body.gst || null;

    const res: BusinessResponse = {
      userID: seedStore.users[0].userID,
      tenantID: seedStore.business.id,
      slug: body.slug,
    };
    return HttpResponse.json(res, { status: 201 });
  }),

  // GET /api/v1/businesses/current
  http.get('/api/v1/businesses/current', async () => {
    const res: BusinessesResponse = seedStore.business;
    return HttpResponse.json(res, { status: 200 });
  }),
];
