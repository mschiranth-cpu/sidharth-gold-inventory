import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ClientPortalLayout from '../../components/layout/ClientPortalLayout';
const logout = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'client', role: 'CLIENT' }, isAuthenticated: true, isLoading: false, logout }) }));
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => ({ isChecking: false, isError: false, isAdmin: false, canUsePath: (path: string) => path === '/client/profile', refetch: vi.fn() }) }));
describe('Client portal feature recovery', () => {
  it('hides denied portal links while keeping profile and logout working', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/client/dashboard']}><Routes><Route path="/" element={<p>Signed out destination</p>} /><Route path="/client" element={<ClientPortalLayout />}><Route path="dashboard" element={<p>Dashboard data</p>} /><Route path="profile" element={<p>Profile settings</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Orders' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Module access unavailable');
    await user.click(screen.getByRole('link', { name: 'Profile' }));
    expect(screen.getByText('Profile settings')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Signed out destination')).toBeInTheDocument();
  });
});
