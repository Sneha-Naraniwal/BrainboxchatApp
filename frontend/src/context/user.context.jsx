import React, { createContext, useState, useEffect } from 'react';

// Create the UserContext
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
    const [ user, setUser ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(true);

    useEffect(() => {
        // Just mark as not loading - let UserAuth handle profile fetching
        console.log('UserProvider mounted');
        setIsLoading(false);
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};


