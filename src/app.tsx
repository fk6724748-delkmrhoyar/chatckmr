/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import ChatLayout from './components/ChatLayout';
import InstallScreen from './components/InstallScreen';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import { useAppStore } from './lib/store';

// Admin is reachable at domain.com/ckmr (also /admin, #/ckmr and #/admin)
const isAdminRoute = () => {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/ckmr' ||
    path === '/admin' ||
    hash === '#/ckmr' ||
    hash === '#/admin' ||
    hash === '#ckmr'
  );
};

export default function App() {
  const isInstalled = useAppStore(state => state.systemSettings.isInstalled);
  const systemSettings = useAppStore(state => state.systemSettings);
  const currentUser = useAppStore(state => state.currentUser);
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const heartbeat = useAppStore(state => state.heartbeat);
  const purgeExpiredStatuses = useAppStore(state => state.purgeExpiredStatuses);
  const [adminRoute, setAdminRoute] = useState(isAdminRoute());

  useEffect(() => {
    document.title = systemSettings?.appName || 'Umar Chat';
  }, [systemSettings?.appName]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleRouteChange = () => setAdminRoute(isAdminRoute());
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Online presence ping + 24h status auto delete
  useEffect(() => {
    if (!currentUser) return;
    heartbeat();
    purgeExpiredStatuses();
    const ping = setInterval(heartbeat, 15000);
    const purge = setInterval(purgeExpiredStatuses, 60000);
    return () => {
      clearInterval(ping);
      clearInterval(purge);
    };
  }, [currentUser?.uid]);

  if (!isInstalled) {
    return <InstallScreen />;
  }

  if (adminRoute) {
    if (!currentUser) {
      return <AuthScreen isAdminRoute={true} />;
    }
    if (!currentUser.isAdmin) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100 flex-col">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have administrator privileges to view this area.</p>
          <a href="#/" className="text-blue-500 hover:underline">Return to Chat</a>
        </div>
      );
    }
    return <AdminPanel currentUser={currentUser} />;
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return <ChatLayout currentUser={currentUser} />;
}
