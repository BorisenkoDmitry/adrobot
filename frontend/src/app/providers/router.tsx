import { createBrowserRouter, Navigate } from 'react-router'

import { CampaignHistoryPage } from '@/pages/campaign-history'
import { CampaignListPage } from '@/pages/campaign-list'
import { CampaignStreamsPage } from '@/pages/campaign-streams'
import { NotFoundPage } from '@/pages/not-found'
import { OverviewPage } from '@/pages/overview'

import { RootLayout } from '../ui/root-layout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/campaigns" replace /> },
      { path: 'campaigns', element: <CampaignListPage /> },
      { path: 'campaigns/:campaignId', element: <CampaignStreamsPage /> },
      { path: 'campaigns/:campaignId/history', element: <CampaignHistoryPage /> },
      { path: 'status', element: <OverviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
