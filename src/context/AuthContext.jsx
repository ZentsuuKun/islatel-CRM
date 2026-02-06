import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const PASSCODES = {
  admin: 'admin123',
  staff: 'staff123'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { role: 'admin' | 'staff' }

  const login = (passcode) => {
    const role = Object.keys(PASSCODES).find(r => PASSCODES[r] === passcode);
    if (role) {
      setUser({ role });
      return { success: true, role };
    }
    return { success: false };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node
};

export default AuthContext;
