import React, { useState, useEffect } from 'react';
import { Calendar as AntCalendar, Card, ConfigProvider, theme as antTheme, Badge, Tooltip, Button } from 'antd';
import { useTheme } from '../context/ThemeContext';
import { getAllHolidays, addHoliday, getCommonHolidays } from '../services/holidayService';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import HolidayModal from '../components/HolidayModal';
import CommonHolidayModal from '../components/CommonHolidayModal';
import { useUser } from '../context/UserContext';

const Calendar = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const navigate = useNavigate();
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [isCommonHolidayModalOpen, setIsCommonHolidayModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [holidays, setHolidays] = useState({}); // Now storing date -> name map
    const [activeWeekdays, setActiveWeekdays] = useState({}); // { 'Sunday': true, ... }
    const [loading, setLoading] = useState(true);

    const { hasPermissionAccess } = useUser();

    const canAddHoliday = () =>
        hasPermissionAccess(
            'Holiday Management',
            'adding'
        );

    const canUpdateHoliday = () =>
        hasPermissionAccess(
            'Holiday Management',
            'updating'
        );

    const allowAddHolidays = canAddHoliday();

    const allowUpdateHolidays = canUpdateHoliday();

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const [holidayData, commonHolidayData] = await Promise.all([
                getAllHolidays(),
                getCommonHolidays()
            ]);

            // Safeguard against non-iterable data
            const holidayList = Array.isArray(holidayData) ? holidayData : (holidayData?.data || []);
            const commonHolidays = commonHolidayData?.data || commonHolidayData || {};

            // Create a map of date string to holiday name
            const holidayMap = {};
            holidayList.forEach(item => {
                if (item && item.holiday) {
                    holidayMap[item.holiday] = item.name || 'Holiday';
                }
            });

            // Set active weekdays from common holiday data
            const weekdays = {
                Sunday: !!commonHolidays.sunday,
                Monday: !!commonHolidays.monday,
                Tuesday: !!commonHolidays.tuesday,
                Wednesday: !!commonHolidays.wednesday,
                Thursday: !!commonHolidays.thursday,
                Friday: !!commonHolidays.friday,
                Saturday: !!commonHolidays.saturday
            };

            setHolidays(holidayMap);
            setActiveWeekdays(weekdays);
        } catch (error) {
            console.log(error);

            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const onSelect = async (value, info) => {
        // Only trigger if a date was clicked, not when year/month changes
        if (info && info.source !== 'date') {
            return;
        }

        const dateString = value.format('YYYY-MM-DD');
        setSelectedDate(dateString);

        if (holidays[dateString]) {
            // Toggle/Delete Holiday
            try {
                // toast.info(`Removing holiday: ${holidays[dateString]}...`);
                await addHoliday({
                    name: holidays[dateString],
                    holiday: dateString
                });
                // toast.success('Holiday removed successfully');
                fetchHolidays();
            } catch (error) {
                if (error?.response?.data?.data) {
                    if (error?.response?.data?.code === 1) {
                        toast.info("Session expired. Please login again.");
                        navigate('/login');
                    } else {
                        toast.error(error?.response?.data?.data);
                    }
                } else {
                    toast.error('Network error');
                }
            }
        } else {
            setIsHolidayModalOpen(true);
        }
    };

    const handleSaveHoliday = () => {
        fetchHolidays();
    };

    const dateFullCellRender = (date) => {
        const dateString = date.format('YYYY-MM-DD');
        const holidayName = holidays[dateString];
        const dayName = date.format('dddd');
        const isRecurringHoliday = activeWeekdays[dayName];
        const isHoliday = !!holidayName || isRecurringHoliday;
        const displayHolidayName = holidayName || (isRecurringHoliday ? 'Common Holiday' : '');

        return (
            <div className={`ant-picker-cell-inner ant-picker-calendar-date ${isHoliday ? 'holiday-cell' : ''}`}>
                <div className="ant-picker-calendar-date-value">
                    {date.date()}
                </div>
                <div className="ant-picker-calendar-date-content">
                    {isHoliday && (
                        <div className="flex flex-col items-center mt-1 px-1">
                            <Badge status="error" title={displayHolidayName} />
                            <div className="text-xs text-center font-medium truncate w-full" style={{ color: '#ff4d4f', fontSize: '10px' }}>
                                {displayHolidayName}
                            </div>
                        </div>
                    )}
                </div>
                <style jsx>{`
                    .holiday-cell {
                        background-color: ${isDarkMode ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.05)'} !important;
                        border: 1px solid rgba(255, 77, 79, 0.2) !important;
                        position: relative;
                    }
                `}</style>
            </div>
        );
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                token: {
                    colorError: '#ff4d4f',
                }
            }}
        >
            <div className="calendar-page p-6">
                <HolidayModal
                    isOpen={isHolidayModalOpen}
                    onClose={() => setIsHolidayModalOpen(false)}
                    onSave={handleSaveHoliday}
                    selectedDate={selectedDate}
                    allowAddHolidays={allowAddHolidays}
                />

                <CommonHolidayModal
                    isOpen={isCommonHolidayModalOpen}
                    onClose={() => setIsCommonHolidayModalOpen(false)}
                    onSave={() => {
                        fetchHolidays();
                    }}
                />

                <div className="page-header flex justify-between items-center mb-6">
                    <div>
                        <h3>Calendar</h3>
                        <p className="subtitle">View and manage your scheduled events and appointments.</p>
                    </div>
                    {allowAddHolidays ?

                        <button className='primary-btn' onClick={() => setIsCommonHolidayModalOpen(true)}>
                            Common Holiday
                        </button> :
                        <button className="primary-btn-disabled" onClick={() => toast.warn("Required Holiday Add Permission")}>
                            Common Holiday
                        </button>
                    }

                </div>
                <Card className="shadow-md rounded-lg overflow-hidden" loading={loading}>
                    <AntCalendar
                        onSelect={onSelect}
                        fullscreen={true}
                        fullCellRender={dateFullCellRender}
                    />
                </Card>
            </div>
        </ConfigProvider>
    );
};

export default Calendar;
