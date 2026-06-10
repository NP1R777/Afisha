import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface UserContextType {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  email: string | null;
  date_of_birth: string | null;
  categories: string[] | null;
  searchQuery: string;
  setUsername: (username: string | null) => void;
  setUserId: (userId: string | null) => void;
  setEmail: (email: string | null) => void;
  setBirthdate: (birthdate: string | null) => void;
  setCategories: (categories: string[] | null) => void;
  setSearchQuery: (query: string) => void;
  login: () => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem('username') || null;
  });

  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('userId') || null;
  });

  const [email, setEmail] = useState<string | null>(() => localStorage.getItem('email') || null);
  const [date_of_birth, setBirthdate] = useState<string | null>(() => localStorage.getItem('date_of_birth') || null);

  const [categories, setCategories] = useState<string[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('userId');
  });

  useEffect(() => {
    if (userId) {
      setIsAuthenticated(true);
      console.log(`Пользователь с ID ${userId} вошёл в систему.`);
    } else {
      setIsAuthenticated(false);
      console.log('Пользователь вышел из системы.');
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('userId');
    }
  }, [userId]);

  useEffect(() => {
    if (email) {
      localStorage.setItem('email', email);
    } else {
      localStorage.removeItem('email');
    }
  }, [email]);

  useEffect(() => {
    if (date_of_birth) {
      localStorage.setItem('date_of_birth', date_of_birth);
    } else {
      localStorage.removeItem('date_of_birth');
    }
  }, [date_of_birth]);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUsername(null);
    setUserId(null);
    setEmail(null);
    setBirthdate(null);
    setCategories(null);
    setSearchQuery('');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('date_of_birth');
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider
      value={{
        isAuthenticated,
        username,
        userId,
        categories,
        email,
        date_of_birth,
        searchQuery,
        setUsername,
        setUserId,
        setCategories,
        setEmail,
        setBirthdate,
        setSearchQuery,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
