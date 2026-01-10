import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getSessionDetails,
  updateSessionStatus,
} from '../../services/api/auditSessions';
import { SessionDetails, UpdateStatusPayload } from '../AuditSessions/types';

export const useSessionDetail = () => {
  const { sessionUid } = useParams<{ sessionUid: string }>();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);

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

  const handleStatusUpdate = async (
    status: 'approved' | 'rejected' | 'flagged',
    reason?: string
  ) => {
    if (!sessionUid) return;

    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: UpdateStatusPayload = { status };
      if (reason) {
        payload.reason = reason;
      }

      const response = await updateSessionStatus(sessionUid, payload);
      if (response.success) {
        setSuccessMessage(
          `Session ${status} successfully!`
        );
        // Refresh session data
        await fetchSessionDetails();
        // Close modals
        setShowRejectModal(false);
        setShowFlagModal(false);
      } else {
        setError(response.message || 'Failed to update session status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = () => {
    handleStatusUpdate('approved');
  };

  const handleReject = (reason: string) => {
    handleStatusUpdate('rejected', reason);
  };

  const handleFlag = (reason: string) => {
    handleStatusUpdate('flagged', reason);
  };

  return {
    sessionData,
    loading,
    error,
    successMessage,
    isUpdating,
    showRejectModal,
    showFlagModal,
    setShowRejectModal,
    setShowFlagModal,
    handleApprove,
    handleReject,
    handleFlag,
    navigate,
  };
};
