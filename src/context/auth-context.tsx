import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type AuthStatus = 'unauthenticated' | 'authenticated' | 'loading';

interface AuthContextType {
  status: AuthStatus;
  setStatus: (status: AuthStatus) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    // 这里可以添加逻辑来检查用户是否已登录，例如通过 API 调用或本地存储
    // 暂时设置为 'unauthenticated'，实际应用中应根据认证状态更新
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, setStatus, isAuthenticated: status === 'authenticated' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};