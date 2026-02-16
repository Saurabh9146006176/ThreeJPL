import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Clock, Users, UserCheck, UserX } from 'lucide-react';
import { getAccessRequests, approveAccess, denyAccess, getCurrentUserEmail } from '../services/storageService';

interface AccessRequest {
  email: string;
  status: string;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
}

export const AdminPage: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const adminEmail = getCurrentUserEmail();

  useEffect(() => {
    loadAccessRequests();
  }, []);

  const loadAccessRequests = async () => {
    try {
      setLoading(true);
      if (!adminEmail) {
        setError('Admin email not found');
        return;
      }
      const data = await getAccessRequests(adminEmail);
      setRequests(data);
    } catch (err: any) {
      setError('Failed to load access requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userEmail: string) => {
    try {
      setProcessing(userEmail);
      setError('');
      setSuccess('');

      await approveAccess(adminEmail!, userEmail);
      setSuccess(`Access granted to ${userEmail}`);

      // Refresh the list
      await loadAccessRequests();
    } catch (err: any) {
      setError(`Failed to approve access: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (userEmail: string) => {
    try {
      setProcessing(userEmail);
      setError('');
      setSuccess('');

      await denyAccess(adminEmail!, userEmail);
      setSuccess(`Access denied to ${userEmail}`);

      // Refresh the list
      await loadAccessRequests();
    } catch (err: any) {
      setError(`Failed to deny access: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            Admin Panel
          </h1>
          <p className="text-slate-400 mt-2">Manage user access requests</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">{requests.length} pending requests</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <X className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3">
          <Check className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Pending Access Requests
          </h2>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No pending access requests</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {requests.map((request) => (
              <div key={request.email} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{request.email}</h3>
                        <p className="text-sm text-slate-400">
                          Requested on {formatDate(request.requested_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(request.email)}
                      disabled={processing === request.email}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {processing === request.email ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>

                    <button
                      onClick={() => handleDeny(request.email)}
                      disabled={processing === request.email}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {processing === request.email ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <UserX className="w-4 h-4" />
                      )}
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};