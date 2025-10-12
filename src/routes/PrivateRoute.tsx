import React from 'react';
import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from 'src/constants/route';
import useAuth from 'src/hooks/useAuth';

type PrivateRouteProps = {
  children: React.ReactNode;
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // hoặc spinner

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.AUTH.LOGIN} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
