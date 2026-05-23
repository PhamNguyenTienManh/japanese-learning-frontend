import { useEffect, useRef } from 'react';
import { addStudyTime } from '~/services/userStudy';
import { studyTimeTracker } from '~/utils/studyTimeTracker';


export function useStudyTimeTracker() {
    const isSavingRef = useRef(false);

    useEffect(() => {
        // Khôi phục session nếu page bị reload
        const hasSession = studyTimeTracker.restoreSession();

        if (!hasSession) {
            // Bắt đầu track mới
            studyTimeTracker.startTracking();
        }

        // Xử lý khi đóng tab/browser
        const handleBeforeUnload = async () => {
            if (isSavingRef.current) return;

            const minutes = await studyTimeTracker.stopTracking();

            if (minutes > 0) {
                // Sử dụng sendBeacon để đảm bảo request được gửi
                const BASE_URL = process.env.REACT_APP_BASE_URL_API;

                const data = JSON.stringify({ minutes });
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon(`${BASE_URL}/study-day/add`, blob);

                console.log('Study time saved via sendBeacon:', minutes, 'minutes');
            }
        };

        // Xử lý khi component unmount (logout, navigate away)
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
                } finally {
                    isSavingRef.current = false;
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            handleUnmount();
        };
    }, []);

    return {
        getCurrentMinutes: () => studyTimeTracker.getCurrentMinutes(),
    };
}
