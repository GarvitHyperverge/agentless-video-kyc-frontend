import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionsList } from '../../services/api/auditSessions';
import { SessionListItem, SessionsListResponse } from './types';

export type FilterType = 'pending' | 'completed' | 'all';

export const useSessionsList = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('pending');

  const fetchSessions = useCallback(async (filterValue: FilterType) => {
    setLoading(true);
    setError(null);
    try {
      const response: SessionsListResponse = await getSessionsList(filterValue);
      if (response.success) {
        setSessions(response.data.sessions);
        setTotal(response.data.total);
      } else {
        setError(response.message || 'Failed to fetch sessions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(filter);
  }, [filter, fetchSessions]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
  };

  const handleRowClick = (sessionUid: string) => {
    navigate(`/audit/sessions/${sessionUid}`);
  };

  return {
    sessions,
    total,
    loading,
    error,
    filter,
    handleFilterChange,
    handleRowClick,
    refresh: () => {
      fetchSessions(filter);
    },
  };
};
