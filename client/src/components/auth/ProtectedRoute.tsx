// FILE: client/src/components/auth/ProtectedRoute.tsx
// 2026 Standard: Comprehensive route protection with role-based access control

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
    /**
     * Allowed roles for this route. If empty, any authenticated user can access.
     */
    allowedRoles?: UserRole[];
    /**
     * Redirect path for unauthenticated users
     */
    redirectTo?: string;
    /**
     * Custom component to render while checking auth
     */
    loadingFallback?: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * 
 * Provides comprehensive route protection with:
 * - Authentication verification
 * - Role-based access control
 * - Redirect preservation (return to original page after login)
 * - Loading state handling
 * 
 * @example
 * // Protect route for any authenticated user
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 * 
 * @example
 * // Protect route for specific roles
 * <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']} />}>
 *   <Route path="/admin" element={<AdminPanel />} />
 * </Route>
 */
export const ProtectedRoute = ({
    allowedRoles = [],
    redirectTo = '/login',
    loadingFallback
}: ProtectedRouteProps) => {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoading) {
        return loadingFallback ?? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    <p className="text-sm text-slate-500 animate-pulse">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        // Preserve the attempted URL for redirect after login
        return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
    }

    // Check role-based access if roles are specified
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // User is authenticated but doesn't have the required role
        return <AccessDenied userRole={user.role} requiredRoles={allowedRoles} />;
    }

    // User is authenticated and authorized
    return <Outlet />;
};

/**
 * Access Denied Component
 * Shown when user doesn't have required role for a route
 */
const AccessDenied = ({
    userRole,
    requiredRoles
}: {
    userRole: UserRole;
    requiredRoles: UserRole[];
}) => {
    const navigate = useNavigate();

    // Determine the appropriate dashboard for the user's role
    const getDashboardPath = (role: UserRole): string => {
        const dashboardPaths: Record<UserRole, string> = {
            'SUPER_ADMIN': '/dashboard',
            'ADMIN': '/dashboard',
            'TEACHER': '/teacher/dashboard',
            'STUDENT': '/student/dashboard',
            'PARENT': '/parent/dashboard',
        };
        return dashboardPaths[role] || '/dashboard';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
                    <p className="mt-2 text-slate-600">
                        You don't have permission to access this page.
                    </p>
                </div>

                {/* Details */}
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                    <p>
                        <span className="font-medium">Your role:</span>{' '}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                            {userRole}
                        </span>
                    </p>
                    <p className="mt-2">
                        <span className="font-medium">Required:</span>{' '}
                        {requiredRoles.map((role, index) => (
                            <span key={role}>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {role}
                                </span>
                                {index < requiredRoles.length - 1 && <span className="mx-1">or</span>}
                            </span>
                        ))}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate(getDashboardPath(userRole))}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

// Need to import useNavigate for AccessDenied component
import { useNavigate } from 'react-router-dom';

export default ProtectedRoute;
