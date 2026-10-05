import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { businessHandlers } from './handlers/business';
import { shopHandlers } from './handlers/shops';
import { billHandlers } from './handlers/bills';
import { receiptHandlers } from './handlers/receipts';
import { returnHandlers } from './handlers/returns';
import { reportHandlers } from './handlers/reports';
import { settingsHandlers } from './handlers/settings';
import { tier1Handlers } from './handlers/tier1';
import { usersHandlers } from './handlers/users';
import { phase11Handlers } from './handlers/phase11';

export const worker = setupWorker(
  ...authHandlers,
  ...businessHandlers,
  ...shopHandlers,
  ...billHandlers,
  ...receiptHandlers,
  ...returnHandlers,
  ...reportHandlers,
  ...settingsHandlers,
  ...tier1Handlers,
  ...usersHandlers,
  ...phase11Handlers
);
