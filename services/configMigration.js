// Create default day schedule
const createDefaultDaySchedule = () => ({
    enabled: false,
    postCount: 0,
    isLongPost: false,
    postTimes: []
});

// Create default weekly schedule
export const createDefaultWeeklySchedule = () => ({
    monday: createDefaultDaySchedule(),
    tuesday: createDefaultDaySchedule(),
    wednesday: createDefaultDaySchedule(),
    thursday: createDefaultDaySchedule(),
    friday: createDefaultDaySchedule(),
    saturday: createDefaultDaySchedule(),
    sunday: createDefaultDaySchedule()
});

// Migrate legacy config to new format
export const migrateConfig = (config) => {
    // If already has weeklySchedule, return as-is
    if (config.weeklySchedule) {
        return config;
    }

    // Create new weekly schedule from legacy settings
    const weeklySchedule = createDefaultWeeklySchedule();

    // Migrate daily posts (Monday-Friday at specified time)
    if (config.dailyPostEnabled) {
        const time = config.dailyPostTime || '09:00';
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((day) => {
            weeklySchedule[day] = {
                enabled: true,
                postCount: 1,
                isLongPost: false,
                postTimes: [time]
            };
        });
    }

    // Migrate weekly long post
    if (config.weeklyPostEnabled) {
        const dayIndex = config.weeklyPostDay || 1; // Default to Monday
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayIndex];
        const time = config.weeklyPostTime || '10:00';

        // If this day already has posts from daily migration, add to existing
        if (weeklySchedule[dayName].enabled) {
            weeklySchedule[dayName].postTimes.push(time);
            weeklySchedule[dayName].postCount++;
            weeklySchedule[dayName].isLongPost = true;
        } else {
            weeklySchedule[dayName] = {
                enabled: true,
                postCount: 1,
                isLongPost: true,
                postTimes: [time]
            };
        }
    }

    return {
        ...config,
        weeklySchedule
    };
};

// Validate schedule configuration
export const validateSchedule = (schedule) => {
    const errors = [];

    Object.entries(schedule).forEach(([day, daySchedule]) => {
        if (daySchedule.enabled) {
            if (daySchedule.postTimes.length === 0) {
                errors.push(`${day}: No post times specified`);
            }
            if (daySchedule.postTimes.length !== daySchedule.postCount) {
                errors.push(`${day}: Post count mismatch`);
            }
            if (daySchedule.postCount > 6) {
                errors.push(`${day}: Maximum 6 posts per day`);
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};
