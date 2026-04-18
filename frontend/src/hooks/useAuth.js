import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Additional auth-related hooks
export const useLogin = () => {
  const { login } = useAuth();
  return login;
};

export const useLogout = () => {
  const { logout } = useAuth();
  return logout;
};

export const useRegister = () => {
  const { register } = useAuth();
  return register;
};

export const useUser = () => {
  const { user } = useAuth();
  return user;
};

export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const useAuthLoading = () => {
  const { loading } = useAuth();
  return loading;
};

export const useUpdateUser = () => {
  const { updateUser } = useAuth();
  return updateUser;
};

export const useVerifyOTP = () => {
  const { verifyOTP } = useAuth();
  return verifyOTP;
};

export default useAuth;