import React from 'react';
import { 
  LayoutDashboard, 
  Droplets, 
  History as HistoryIcon, 
  Settings, 
  TrendingUp, 
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'water', label: 'Monitoring', icon: <Droplets size={20} /> },
  { id: 'sales', label: 'Sales Report', icon: <TrendingUp size={20} /> },
  { id: 'history', label: 'History', icon: <HistoryIcon size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
};