export interface SessionListItem {
  session_uid: string;
  external_txn_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  source_party?: string;
}

export interface SessionsListResponse {
  success: boolean;
  data: {
    sessions: SessionListItem[];
    total: number;
  };
  message?: string;
}

export interface FieldMatchResult {
  value1: string;
  value2: string;
  match: boolean;
}

export interface FieldMatchResults {
  allMatched: boolean;
  results: {
    name: FieldMatchResult;
    dateOfBirth: FieldMatchResult;
    idNumber: FieldMatchResult;
    fatherName: FieldMatchResult;
  };
}

export interface SessionDetails {
  session: {
    session_uid: string;
    external_txn_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  businessPartnerPanData: {
    pan_number: string;
    full_name: string;
    father_name: string;
    date_of_birth: string;
    source_party: string;
  };
  cardIdValidation: {
    id_number: string;
    full_name: string;
    date_of_birth: string;
    father_name: string;
  };
  fieldMatchResults: FieldMatchResults;
  faceMatchResult: {
    match_value: string;
    match_confidence: string;
    action: string;
  };
  selfieValidation: {
    live_face_value: string;
    live_face_confidence: string;
    action: string;
  };
  sessionMetadata: {
    latitude: number;
    longitude: number;
    camera_permission: boolean;
    microphone_permission: boolean;
    location_permission: boolean;
    ip_address: string;
    device_type: string;
  };
}

export interface SessionDetailsResponse {
  success: boolean;
  data: SessionDetails;
  message?: string;
}

export interface UpdateStatusPayload {
  status: 'approved' | 'rejected' | 'flagged';
  reason?: string;
}

export interface UpdateStatusResponse {
  success: boolean;
  data: {
    session_uid: string;
    status: string;
  };
  message?: string;
}
