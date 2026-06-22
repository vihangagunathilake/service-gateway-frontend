import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Lock, ArrowRight, Loader2, Mail, ArrowLeft } from 'lucide-react';
import RegisterModal from '../components/RegisterModal';
import { getConfig } from '../config';
import { useTheme } from '../context/ThemeContext';
import '../App.css'; // We'll add specific styles in App.css

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isSendingToken, setIsSendingToken] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [changeToken, setChangeToken] = useState('');   // login password = emailString
    const [changeEmail, setChangeEmail] = useState('');   // email from login response
    const [changeForgot, setChangeForgot] = useState(false); // forgot from login response
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const navigate = useNavigate();
    const { theme } = useTheme();

    const isDarkMode = theme === 'dark';
    const logoSrc = isDarkMode
        ? process.env.PUBLIC_URL + "/logo512_d.png"
        : process.env.PUBLIC_URL + "/logo512_l.png";

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const baseUrl = getConfig().baseUrl;
            const response = await axios.post(`${baseUrl}/user/login`, {
                username,
                password
            });

            if (response.data && response.data.data) {
                const { token, refreshToken, name, email, userType, password: passwordValid, forgot:  forgot} = response.data.data;

                if (passwordValid === false) {
                    localStorage.setItem('tempToken', token);
                    setChangeEmail(username); // username field is the email
                    setChangeToken(password); // login password = emailString (temporary token)
                    setChangeForgot(forgot || false);
                    setShowChangePassword(true);
                    return;
                }

                localStorage.setItem('isAuthenticated', 'true');
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

    const handleChangePassword = async (e) => {

        e.preventDefault();
        if (newPassword !== repeatPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setIsChangingPassword(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const tempToken = localStorage.getItem('tempToken');
            await axios.post(`${baseUrl}/user/new-password`, {
                emailString: changeToken,
                newPassword,
                email: changeEmail,
                forgot: changeForgot,
            }, {
                headers: { 'Authorization': `Bearer ${tempToken}` }
            });
            toast.success('Password Reset Completed');
            localStorage.removeItem('tempToken');
            setShowChangePassword(false);
            setChangeToken('');
            setChangeEmail('');
            setChangeForgot(false);
            setNewPassword('');
            setRepeatPassword('');
        } catch (error) {
            const errorMessage = error.response?.data?.data || 'Failed to reset password';
            toast.error(errorMessage);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSendToken = async (e) => {
        e.preventDefault();
        setIsSendingToken(true);

        try {
            const baseUrl = getConfig().baseUrl;
            await axios.post(`${baseUrl}/user/forget-password`, { email: forgotEmail });
            toast.success('Password reset token sent to your email');
            setShowForgotPassword(false);
            setForgotEmail('');
        } catch (error) {
            const errorMessage = error.response?.data?.data || 'Failed to send token';
            toast.error(errorMessage);
        } finally {
            setIsSendingToken(false);
        }
    };

    return (
        <div className="login-container">
            {showChangePassword ? (
                <div className="login-card">
                    <div className="login-header">
                        <img src={logoSrc} alt="Service Gateway Logo" className="login-logo" />
                        <p>Set a new password to continue</p>
                    </div>
                    <form onSubmit={handleChangePassword} className="login-form">
                        <div className="input-group">
                            <Lock className="input-icon" size={20} />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <Lock className="input-icon" size={20} />
                            <input
                                type="password"
                                placeholder="Repeat Password"
                                value={repeatPassword}
                                onChange={(e) => setRepeatPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={isChangingPassword}>
                            {isChangingPassword ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    Update Password
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                    <div className="login-footer">
                        <p onClick={() => setShowChangePassword(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <ArrowLeft size={14} /> Back to Sign In
                        </p>
                    </div>
                </div>
            ) : showForgotPassword ? (
                <div className="login-card">
                    <div className="login-header">
                        <img src={logoSrc} alt="Service Gateway Logo" className="login-logo" />
                        <p>Enter your email to receive a reset token</p>
                    </div>
                    <form onSubmit={handleSendToken} className="login-form">
                        <div className="input-group">
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={isSendingToken}>
                            {isSendingToken ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    Send Token
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                    <div className="login-footer">
                        <p onClick={() => setShowForgotPassword(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <ArrowLeft size={14} /> Back to Sign In
                        </p>
                    </div>
                </div>
            ) : (
                <div className="login-card">
                    <div className="login-header">
                        <img src={logoSrc} alt="Service Gateway Logo" className="login-logo" />
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
                        <p onClick={() => setShowForgotPassword(true)}>Forgot Password?</p>
                        <p className="register-text">
                            Don't have an account? <span className="register-link" onClick={() => setIsRegisterModalOpen(true)}>Register</span>
                        </p>
                    </div>
                </div>
            )}

            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
            />
        </div>
    );
};

export default Login;
