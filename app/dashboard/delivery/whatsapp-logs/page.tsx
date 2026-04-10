"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/src/components/Card';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Search, Send, Clock, Phone, MessageSquare, AlertCircle, RefreshCw, CheckCircle2, LayoutDashboard, Share2, Eye, ShieldCheck, Zap } from 'lucide-react';
import apiClient from '@/src/lib/axios';

export default function WhatsAppLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const response = await apiClient.get('v1/whatsapp-logs/');
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLogs = logs.filter(log => 
    log.phone_number?.includes(searchQuery) || 
    log.message_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.delivery_person_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-in fade-in duration-700">
        <div className="flex flex-col items-center gap-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-glow-emerald"></div>
          <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.4em] animate-pulse">Syncing Communication Node...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary p-5 rounded-2xl border border-base relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              TRANSIT LOGS
            </h1>
            <p className="text-tertiary text-[10px] mt-0.5 uppercase tracking-widest font-bold">Fleet Secure Communication Feed</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button 
            variant="outline" 
            onClick={() => fetchData(true)}
            isLoading={isRefreshing}
            className="border-base hover:bg-base h-10 px-6 uppercase tracking-widest text-[10px] font-bold rounded-xl"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Resync Feed
          </Button>
        </div>
      </div>

      <div className="bg-secondary rounded-2xl border border-base overflow-hidden shadow-lg relative">
        {/* Operations Toolbar */}
        <div className="p-5 border-b border-base bg-surface flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative flex-1 w-full max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
             <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-black/40 border border-base rounded-xl pl-10 pr-4 text-[10px] font-bold text-white uppercase tracking-widest focus:border-emerald-500/50 transition-all placeholder-[#555]"
             />
          </div>
          <p className="flex items-center gap-2 text-tertiary text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-base rounded-xl border border-base">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-white">{filteredLogs.length}</span> SIGNALS
          </p>
        </div>

        {/* Data Stream */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-surface">
                <th className="px-10 py-8 text-[11px] font-black text-tertiary uppercase tracking-[0.3em] border-b border-base">Transmission Status</th>
                <th className="px-10 py-8 text-[11px] font-black text-tertiary uppercase tracking-[0.3em] border-b border-base">Recipient Unit</th>
                <th className="px-10 py-8 text-[11px] font-black text-tertiary uppercase tracking-[0.3em] border-b border-base">Signal Content</th>
                <th className="px-10 py-8 text-[11px] font-black text-tertiary uppercase tracking-[0.3em] border-b border-base">Timestamp</th>
                <th className="px-10 py-8 text-[11px] font-black text-tertiary uppercase tracking-[0.3em] border-b border-base">Payload Type</th>
              </tr>
            </thead>
            <tbody className="divide-base">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center text-tertiary text-[11px] uppercase tracking-[0.5em] font-black italic opacity-20 leading-relaxed max-w-sm mx-auto">No communication signals detected on the frequency</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-surface transition-colors group">
                    <td className="px-6 py-6 border-b border-base">
                      <Badge className={`${
                        log.status === 'sent' || log.status === 'delivered' || log.status === 'read' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      } uppercase text-[8px] font-bold tracking-widest px-3 py-1 rounded-full border shadow-sm`}>
                        {log.status === 'sent' || log.status === 'delivered' || log.status === 'read' ? (
                          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> {log.status}</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {log.status}</span>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-6 border-b border-base">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-white uppercase tracking-widest group-hover:text-emerald-400 transition-colors duration-300">{log.delivery_person_name || 'Fleet Operator'}</span>
                        <span className="text-[10px] font-bold text-tertiary flex items-center gap-2 opacity-60"><Phone className="w-3 h-3 opacity-40" /> {log.phone_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 border-b border-base max-w-md">
                       <div className="p-3 rounded-xl bg-black/40 border border-base">
                          <p className="text-[10px] text-tertiary font-bold leading-relaxed truncate">"{log.message_text || log.message}"</p>
                       </div>
                    </td>
                    <td className="px-10 py-10 border-b border-base">
                      <div className="flex items-center gap-3 text-[10px] font-black text-tertiary uppercase tracking-widest opacity-60">
                        <Clock className="w-4 h-4 text-emerald-500 opacity-40 shadow-glow-emerald/20" />
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-10 py-10 border-b border-base">
                      <Badge className="bg-base text-tertiary border-base uppercase text-[8px] font-black tracking-widest px-3 py-1 rounded-lg">
                        {log.target_type || 'Unknown'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer hint */}
      <div className="flex justify-center items-center gap-3 text-tertiary text-[9px] font-black uppercase tracking-[0.5em] opacity-10 py-4">
        <span>--- SECURE NODE FEED END ---</span>
      </div>
    </div>
  );
}
