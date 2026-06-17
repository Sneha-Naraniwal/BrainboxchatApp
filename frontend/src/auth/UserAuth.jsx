import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const UserAuth = ({ children }) => {

    const { user, setUser } = useContext(UserContext)
    const [ loading, setLoading ] = useState(true)
    const token = localStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(() => {
        if (!token) {
            console.log('🔒 No token found, redirecting to login');
            navigate('/login')
            setLoading(false)
            return
        }

        console.log('🔓 Token found, checking user...');

        if (user) {
            console.log('✅ User already in context');
            setLoading(false)
            return
        }

        // Fetch user profile
        console.log('📡 Fetching user profile from API...');
        axios.get('/users/profile')
            .then((res) => {
                console.log('✅ Profile loaded:', res.data.user.email);
                setUser(res.data.user);
                setLoading(false);
            })
            .catch((err) => {
                console.error('❌ Profile fetch failed:', err.message);
                localStorage.removeItem('token');
                navigate('/login');
                setLoading(false);
            });

    }, [token])

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100">Loading dashboard...</div>
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}

export default UserAuth