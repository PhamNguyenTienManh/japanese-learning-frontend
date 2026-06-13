class StudyTimeTracker {
    constructor() {
        this.activeStartedAt = null;
        this.accumulatedMs = 0;
        this.isTracking = false;
        this.storageKey = 'study_session_state';
        this.legacyLoginTimeKey = 'study_login_time';
    }

    persistSession() {
        if (!this.isTracking) {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.legacyLoginTimeKey);
            return;
        }

        localStorage.setItem(
            this.storageKey,
            JSON.stringify({
                activeStartedAt: this.activeStartedAt,
                accumulatedMs: this.accumulatedMs,
            })
        );
        localStorage.removeItem(this.legacyLoginTimeKey);
    }

    startTracking() {
        if (this.isTracking && this.activeStartedAt) return;

        this.activeStartedAt = Date.now();
        this.isTracking = true;
        this.persistSession();

        console.log('Study tracking active at:', new Date(this.activeStartedAt));
    }

    pauseTracking() {
        if (!this.isTracking || !this.activeStartedAt) return;

        this.accumulatedMs += Date.now() - this.activeStartedAt;
        this.activeStartedAt = null;
        this.persistSession();

        console.log('Study tracking paused. Accumulated minutes:', this.getCurrentMinutes());
    }

    async stopTracking() {
        if (!this.isTracking) return 0;

        if (this.activeStartedAt) {
            this.accumulatedMs += Date.now() - this.activeStartedAt;
        }

        const studyMinutes = Math.floor(this.accumulatedMs / 60000);

        console.log('Study session ended. Total minutes:', studyMinutes);

        this.isTracking = false;
        this.activeStartedAt = null;
        this.accumulatedMs = 0;
        this.persistSession();

        return studyMinutes;
    }

    restoreSession() {
        const savedSession = localStorage.getItem(this.storageKey);

        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                this.activeStartedAt =
                    typeof parsed.activeStartedAt === 'number' ? parsed.activeStartedAt : null;
                this.accumulatedMs =
                    typeof parsed.accumulatedMs === 'number' ? parsed.accumulatedMs : 0;
                this.isTracking = true;
                console.log('Study session restored. Accumulated minutes:', this.getCurrentMinutes());
                return true;
            } catch (error) {
                localStorage.removeItem(this.storageKey);
            }
        }

        const savedLoginTime = localStorage.getItem(this.legacyLoginTimeKey);

        if (savedLoginTime) {
            this.activeStartedAt = parseInt(savedLoginTime, 10);
            this.accumulatedMs = 0;
            this.isTracking = true;
            this.persistSession();
            console.log('Study session restored from:', new Date(this.activeStartedAt));
            return true;
        }

        return false;
    }

    getCurrentMinutes() {
        if (!this.isTracking) return 0;

        const activeMs = this.activeStartedAt ? Date.now() - this.activeStartedAt : 0;
        return Math.floor((this.accumulatedMs + activeMs) / 60000);
    }
}

export const studyTimeTracker = new StudyTimeTracker();
