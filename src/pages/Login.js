import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import RegisterModal from '../components/RegisterModal';
import { getConfig } from '../config';
import '../App.css'; // We'll add specific styles in App.css

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const baseUrl = getConfig().baseUrl;
            const response = await axios.post(`${baseUrl}/user/login`, {
                username,
                password
            });

            localStorage.setItem('isAuthenticated', 'true');
            if (response.data && response.data.data) {
                const { token, refreshToken, name, email, userType } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);

                // Store user information for profile display
                if (name) localStorage.setItem('userName', name);
                if (email) localStorage.setItem('userEmail', email);
                if (userType) localStorage.setItem('userType', userType);
            }

            // toast.success('Login Successful');
            navigate('/dashboard');
        } catch (error) {
            const errorMessage = error.response?.data?.data || 'Network Error';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img src={process.env.PUBLIC_URL + "/logo512.png"} alt="Service Gateway Logo" className="login-logo" />
                    {/* <h2>Welcome Back</h2> */}
                    <p>Please sign in to continue</p>
                </div>
                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <User className="input-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <Lock className="input-icon" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Signing In...
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>
                <div className="login-footer">
                    <p>Forgot Password?</p>
                    <p className="register-text">
                        Don't have an account? <span className="register-link" onClick={() => setIsRegisterModalOpen(true)}>Register</span>
                    </p>
                </div>
            </div>

            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
            />
        </div>
    );
};

export default Login;
