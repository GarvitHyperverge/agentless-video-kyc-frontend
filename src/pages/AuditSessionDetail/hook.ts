import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getSessionDetails,
} from '../../services/api/auditSessions';
import { updateAuditStatus } from '../../services/api/verificationSessions';
import { SessionDetails } from '../AuditSessions/types';

export const useSessionDetail = () => {
  const { sessionUid } = useParams<{ sessionUid: string }>();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSessionDetails = useCallback(async () => {
    if (!sessionUid) {
      setError('Session UID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getSessionDetails(sessionUid);
      if (response.success) {
        // Compute fieldMatchResults from the data since API doesn't return it
        const data = response.data;
        const fieldMatchResults = {
          allMatched: true,
          results: {
            name: {
              value1: data.businessPartnerPanData.full_name,
              value2: data.cardIdValidation.full_name,
              match: data.businessPartnerPanData.full_name.toLowerCase().trim() === 
                     data.cardIdValidation.full_name.toLowerCase().trim(),
            },
            dateOfBirth: {
              value1: data.businessPartnerPanData.date_of_birth,
              value2: data.cardIdValidation.date_of_birth,
              match: data.businessPartnerPanData.date_of_birth === data.cardIdValidation.date_of_birth,
            },
            idNumber: {
              value1: data.businessPartnerPanData.pan_number,
              value2: data.cardIdValidation.id_number,
              match: data.businessPartnerPanData.pan_number.toUpperCase().trim() === 
                     data.cardIdValidation.id_number.toUpperCase().trim(),
            },
            fatherName: {
              value1: data.businessPartnerPanData.father_name,
              value2: data.cardIdValidation.father_name,
              match: data.businessPartnerPanData.father_name.toLowerCase().trim() === 
                     data.cardIdValidation.father_name.toLowerCase().trim(),
            },
          },
        };
        fieldMatchResults.allMatched = Object.values(fieldMatchResults.results).every(
          (result) => result.match
        );
        
        const sessionDataWithMatches: SessionDetails = {
          ...data,
          fieldMatchResults,
        };
        
        setSessionData(sessionDataWithMatches);
      } else {
        setError(response.message || 'Failed to fetch session details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session details');
    } finally {
      setLoading(false);
    }
  }, [sessionUid]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  const handleAuditStatusUpdate = async (auditStatus: 'pass' | 'fail') => {
    if (!sessionUid) return;

    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await updateAuditStatus({
        session_id: sessionUid,
        audit_status: auditStatus,
      });

      if (response.success) {
        setSuccessMessage(
          `Audit status updated to ${auditStatus === 'pass' ? 'PASS' : 'FAIL'} successfully!`
        );
        // Refresh session data
        await fetchSessionDetails();
      } else {
        setError(response.message || 'Failed to update audit status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update audit status');
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    sessionData,
    loading,
    error,
    successMessage,
    isUpdating,
    handleAuditStatusUpdate,
    navigate,
  };
};
