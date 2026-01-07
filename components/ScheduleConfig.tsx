import React from 'react';
import { DaySchedule, WeeklySchedule } from '../types';

interface ScheduleConfigProps {
    schedule: WeeklySchedule;
    onScheduleChange: (schedule: WeeklySchedule) => void;
    disabled?: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ScheduleConfig: React.FC<ScheduleConfigProps> = ({ schedule, onScheduleChange, disabled = false }) => {
    const updateDay = (day: keyof WeeklySchedule, updates: Partial<DaySchedule>) => {
        onScheduleChange({
            ...schedule,
            [day]: { ...schedule[day], ...updates }
        });
    };

    const updatePostTime = (day: keyof WeeklySchedule, index: number, time: string) => {
        const newTimes = [...schedule[day].postTimes];
        newTimes[index] = time;
        updateDay(day, { postTimes: newTimes });
    };

    const addPostTime = (day: keyof WeeklySchedule) => {
        const currentCount = schedule[day].postTimes.length;
        if (currentCount < 6) {
            const newTimes = [...schedule[day].postTimes, '09:00'];
            updateDay(day, { postTimes: newTimes, postCount: currentCount + 1 });
        }
    };

    const removePostTime = (day: keyof WeeklySchedule, index: number) => {
        const newTimes = schedule[day].postTimes.filter((_, i) => i !== index);
        updateDay(day, { postTimes: newTimes, postCount: newTimes.length });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {DAYS.map((day, idx) => {
                const daySchedule = schedule[day];

                return (
                    <div
                        key={day}
                        style={{
                            padding: '12px',
                            backgroundColor: daySchedule.enabled ? '#2a2a2a' : '#1a1a1a',
                            border: `1px solid ${daySchedule.enabled ? '#444' : '#333'}`,
                            borderRadius: '6px',
                            opacity: disabled ? 0.5 : 1
                        }}
                    >
                        {/* Day Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                                <input
                                    type="checkbox"
                                    checked={daySchedule.enabled}
                                    onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                                    disabled={disabled}
                                />
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>{DAY_LABELS[idx]}</span>
                            </label>

                            {daySchedule.enabled && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                                    <input
                                        type="checkbox"
                                        checked={daySchedule.isLongPost}
                                        onChange={(e) => updateDay(day, { isLongPost: e.target.checked })}
                                        disabled={disabled}
                                    />
                                    <span>Long Post (500+ words)</span>
                                </label>
                            )}
                        </div>

                        {/* Post Times */}
                        {daySchedule.enabled && (
                            <div style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {daySchedule.postTimes.map((time, timeIdx) => (
                                    <div key={timeIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#888', minWidth: '60px' }}>
                                            Post {timeIdx + 1}:
                                        </span>
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => updatePostTime(day, timeIdx, e.target.value)}
                                            disabled={disabled}
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#1a1a1a',
                                                border: '1px solid #444',
                                                borderRadius: '4px',
                                                color: '#fff',
                                                fontSize: '12px'
                                            }}
                                        />
                                        {daySchedule.postTimes.length > 1 && (
                                            <button
                                                onClick={() => removePostTime(day, timeIdx)}
                                                disabled={disabled}
                                                style={{
                                                    padding: '2px 8px',
                                                    backgroundColor: '#ff6b6b',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {daySchedule.postTimes.length < 6 && (
                                    <button
                                        onClick={() => addPostTime(day)}
                                        disabled={disabled}
                                        style={{
                                            padding: '4px 12px',
                                            backgroundColor: '#00d4ff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            color: '#000',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            alignSelf: 'flex-start'
                                        }}
                                    >
                                        + Add Post Time
                                    </button>
                                )}

                                <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>
                                    {daySchedule.postTimes.length} post{daySchedule.postTimes.length !== 1 ? 's' : ''} scheduled
                                    {daySchedule.isLongPost && ' (1 will be long-form with image)'}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
