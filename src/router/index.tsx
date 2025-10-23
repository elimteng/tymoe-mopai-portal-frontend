import React from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import BaseLayout from '@/layouts/BaseLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Register from '@/pages/Register'
import ApiTest from '@/pages/ApiTest'
import Profile from '@/pages/Profile'
import ItemManagement from '@/pages/ItemManagement'
import ItemApiTest from '@/pages/ItemApiTest'
import OrganizationManagement from '@/pages/OrganizationManagement'
import AccountManagement from '@/pages/AccountManagement'
import DeviceManagement from '@/pages/DeviceManagement'
import ReceiptTemplateManagement from '@/pages/ReceiptTemplateManagement'
import RecipeGuide from '@/pages/RecipeGuide'
import Features from '@/pages/Features'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireOrganization } from '@/auth/RequireOrganization'
import MenuCenter from '@/pages/MenuCenter'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <BaseLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        )
      },
      {
        path: 'menu-center',
        element: (
          <RequireAuth>
            <RequireOrganization>
              <MenuCenter />
            </RequireOrganization>
          </RequireAuth>
        )
      },
      {
        path: 'organizations',
        element: (
          <RequireAuth>
            <OrganizationManagement />
          </RequireAuth>
        )
      },
      {
        path: 'accounts',
        element: (
          <RequireAuth>
            <AccountManagement />
          </RequireAuth>
        )
      },
      {
        path: 'devices',
        element: (
          <RequireAuth>
            <RequireOrganization>
              <DeviceManagement />
            </RequireOrganization>
          </RequireAuth>
        )
      },
      {
        path: 'receipt-templates',
        element: (
          <RequireAuth>
            <RequireOrganization>
              <ReceiptTemplateManagement />
            </RequireOrganization>
          </RequireAuth>
        )
      },
      {
        path: 'features',
        element: (
          <RequireAuth>
            <RequireOrganization>
              <Features />
            </RequireOrganization>
          </RequireAuth>
        )
      },
      {
        path: 'recipe-guide',
        element: (
          <RequireAuth>
            <RequireOrganization>
              <RecipeGuide />
            </RequireOrganization>
          </RequireAuth>
        )
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        )
      },
      {
        path: 'item-management',
        element: (
          <RequireAuth>
            <RequireOrganization>
              <ItemManagement />
            </RequireOrganization>
          </RequireAuth>
        )
      },
      {
        path: 'item-api-test',
        element: (
          <RequireAuth>
            <ItemApiTest />
          </RequireAuth>
        )
      },
      {
        path: 'api-test',
        element: (
          <RequireAuth>
            <ApiTest />
          </RequireAuth>
        )
      }
    ]
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  }
]

export const router = createBrowserRouter(routes)
