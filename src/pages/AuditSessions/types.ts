export interface SessionListItem {
  session_uid: string;
  external_txn_id: string;
  status: string;
  created_at: string;
  updated_at: string;
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
    id?: number;
    session_uid: string;
    pan_number: string;
    full_name: string;
    father_name: string;
    date_of_birth: string;
    source_party: string;
    created_at?: string;
  };
  cardIdValidation: {
    id?: number;
    session_uid: string;
    id_number: string;
    full_name: string;
    date_of_birth: string;
    father_name: string;
    created_at?: string;
  };
  fieldMatchResults?: FieldMatchResults;
  faceMatchResult: {
    id?: number;
    session_uid: string;
    match_value: string;
    match_confidence: string;
    action: string;
    created_at?: string;
  };
  selfieValidation: {
    id?: number;
    session_uid: string;
    live_face_value: string;
    live_face_confidence: string;
    action: string;
    created_at?: string;
  };
  sessionMetadata: {
    id?: number;
    session_uid: string;
    latitude: number;
    longitude: number;
    camera_permission: boolean;
    microphone_permission: boolean;
    location_permission: boolean;
    ip_address: string;
    device_type: string;
    created_at?: string;
    updated_at?: string;
  };
  verificationInputs: Array<{
    id: number;
    session_uid: string;
    input_type: string;
    input_value: string;
    created_at: string;
  }>;
  mediaPaths: {
    images: {
      panFront: string;
      panBack: string;
      selfie: string;
    };
    videos: {
      otpVideo: string;
      sessionRecording: string;
    };
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
