class StudyTimeTracker {
    constructor() {
        this.loginTime = null;
        this.isTracking = false;
    }

    // Bắt đầu track khi user login
    startTracking() {
        if (this.isTracking) return;

        this.loginTime = Date.now();
        this.isTracking = true;
        localStorage.setItem('study_login_time', this.loginTime.toString());

        console.log('Study tracking started at:', new Date(this.loginTime));
    }

    // Dừng track và lưu thời gian
    async stopTracking() {
        if (!this.isTracking || !this.loginTime) return 0;

        const studyTimeMs = Date.now() - this.loginTime;
        const studyMinutes = Math.floor(studyTimeMs / 60000);

        console.log('Study session ended. Total minutes:', studyMinutes);

        this.isTracking = false;
        this.loginTime = null;
        localStorage.removeItem('study_login_time');

        return studyMinutes;
    }

    // Khôi phục session nếu trang được reload
    restoreSession() {
        const savedLoginTime = localStorage.getItem('study_login_time');

        if (savedLoginTime) {
            this.loginTime = parseInt(savedLoginTime, 10);
            this.isTracking = true;
            console.log('Study session restored from:', new Date(this.loginTime));
            return true;
        }

        return false;
    }

    // Lấy số phút hiện tại (không lưu)
    getCurrentMinutes() {
        if (!this.isTracking || !this.loginTime) return 0;

        const studyTimeMs = Date.now() - this.loginTime;
        return Math.floor(studyTimeMs / 60000);
    }
}

export const studyTimeTracker = new StudyTimeTracker();