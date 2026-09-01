import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const PropertiesContext = createContext(null);

export function PropertiesProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProperties();
      setProperties(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <PropertiesContext.Provider value={{ properties, loading, error, reload }}>
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error('useProperties deve essere usato dentro PropertiesProvider');
  return ctx;
}
