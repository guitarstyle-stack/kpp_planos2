/**
 * Error Codes for Server Actions
 * รหัสข้อผิดพลาดสำหรับ Server Actions เพื่อช่วยในการ debug โดยไม่เปิดเผยข้อมูลภายใน
 */

export const ErrorCodes = {
    // Authentication & Authorization
    AUTH_UNAUTHORIZED: 'AUTH_001',
    AUTH_LOGIN_REQUIRED: 'AUTH_002',
    AUTH_ADMIN_REQUIRED: 'AUTH_003',
    AUTH_FORBIDDEN: 'AUTH_004',
    AUTH_SESSION_EXPIRED: 'AUTH_005',

    // User Management
    USER_NOT_FOUND: 'USER_001',
    USER_UPDATE_FAILED: 'USER_002',
    USER_CREATE_FAILED: 'USER_003',
    USER_DELETE_FAILED: 'USER_004',
    USER_STATUS_UPDATE_FAILED: 'USER_005',

    // Project Management
    PROJECT_NOT_FOUND: 'PROJ_001',
    PROJECT_CREATE_FAILED: 'PROJ_002',
    PROJECT_UPDATE_FAILED: 'PROJ_003',
    PROJECT_DELETE_FAILED: 'PROJ_004',
    PROJECT_SEARCH_FAILED: 'PROJ_005',
    PROJECT_UNAUTHORIZED: 'PROJ_006',

    // Report Management
    REPORT_NOT_FOUND: 'REPO_001',
    REPORT_CREATE_FAILED: 'REPO_002',
    REPORT_UPDATE_FAILED: 'REPO_003',
    REPORT_DELETE_FAILED: 'REPO_004',

    // Notification Management
    NOTIFICATION_SEND_FAILED: 'NOTIF_001',
    NOTIFICATION_TEMPLATE_SAVE_FAILED: 'NOTIF_002',
    NOTIFICATION_SCHEDULE_FAILED: 'NOTIF_003',

    // File/Attachment Management
    FILE_UPLOAD_FAILED: 'FILE_001',
    FILE_DELETE_FAILED: 'FILE_002',
    FILE_INVALID_TYPE: 'FILE_003',
    FILE_TOO_LARGE: 'FILE_004',

    // Department Management
    DEPT_NOT_FOUND: 'DEPT_001',
    DEPT_CREATE_FAILED: 'DEPT_002',
    DEPT_UPDATE_FAILED: 'DEPT_003',
    DEPT_DELETE_FAILED: 'DEPT_004',

    // Role Management
    ROLE_ASSIGN_FAILED: 'ROLE_001',
    ROLE_REMOVE_FAILED: 'ROLE_002',
    ROLE_NOT_FOUND: 'ROLE_003',

    // Validation Errors
    VALIDATION_FAILED: 'VAL_001',
    VALIDATION_MISSING_FIELD: 'VAL_002',
    VALIDATION_INVALID_FORMAT: 'VAL_003',

    // Database Errors
    DB_QUERY_FAILED: 'DB_001',
    DB_CONNECTION_FAILED: 'DB_002',
    DB_CONSTRAINT_VIOLATION: 'DB_003',

    // General Errors
    INTERNAL_SERVER_ERROR: 'SYS_001',
    UNKNOWN_ERROR: 'SYS_002',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * สร้าง error response ที่มีโครงสร้าง
 */
export function createErrorResponse(message: string, code: ErrorCode, details?: any) {
    return {
        success: false,
        message,
        code,
        ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
    };
}

/**
 * สร้าง success response ที่มีโครงสร้าง
 */
export function createSuccessResponse<T = any>(data?: T, message?: string) {
    return {
        success: true,
        ...(message ? { message } : {}),
        ...(data ? { data } : {}),
    };
}
