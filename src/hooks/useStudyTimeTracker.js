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
                const token = localStorage.getItem('token');
                const BASE_URL = 'http://localhost:9090/api';

                const data = JSON.stringify({ minutes });
                const blob = new Blob([data], { type: 'application/json' });

                // Gửi request với token trong body
                // Lưu ý: Backend cần hỗ trợ lấy token từ body cho endpoint này
                const dataWithAuth = JSON.stringify({
                    minutes,
                    token // Gửi token trong body vì sendBeacon không support custom headers
                });
                const blobWithAuth = new Blob([dataWithAuth], { type: 'application/json' });

                navigator.sendBeacon(`${BASE_URL}/study-day/add`, blobWithAuth);

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