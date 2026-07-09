import { useEffect, useRef } from 'react';
import { addStudyTime } from '~/services/userStudy';
import { studyTimeTracker } from '~/utils/studyTimeTracker';

export function useStudyTimeTracker() {
    const isSavingRef = useRef(false);

    useEffect(() => {
        const shouldTrack = () =>
            document.visibilityState === 'visible' && document.hasFocus();

        const hasSession = studyTimeTracker.restoreSession();

        if (!hasSession) {
            studyTimeTracker.startTracking();
        }

        if (!shouldTrack()) {
            studyTimeTracker.pauseTracking();
        }

        const handleVisibilityChange = () => {
            if (shouldTrack()) {
                studyTimeTracker.startTracking();
            } else {
                studyTimeTracker.pauseTracking();
            }
        };

        const handleBlur = () => {
            studyTimeTracker.pauseTracking();
        };

        const handleFocus = () => {
            if (shouldTrack()) {
                studyTimeTracker.startTracking();
            }
        };

        const handleBeforeUnload = async () => {
            if (isSavingRef.current) return;

            const minutes = await studyTimeTracker.stopTracking();

            if (minutes > 0) {
                const BASE_URL = process.env.REACT_APP_API_URL;
                const data = JSON.stringify({ minutes });
                const blob = new Blob([data], { type: 'application/json' });

                navigator.sendBeacon(`${BASE_URL}/study-day/add`, blob);
                console.log('Study time saved via sendBeacon:', minutes, 'minutes');
            }
        };

        const handleUnmount = async () => {
            if (isSavingRef.current) return;
            isSavingRef.current = true;

            const minutes = await studyTimeTracker.stopTracking();

            if (minutes > 0) {
                try {
                    await addStudyTime(minutes);
                    console.log('Study time saved on unmount:', minutes, 'minutes');
                } catch (error) {
                    console.error('Failed to save study time:', error);
                }
            }

            isSavingRef.current = false;
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            handleUnmount();
        };
    }, []);

    return {
        getCurrentMinutes: () => studyTimeTracker.getCurrentMinutes(),
    };
}
