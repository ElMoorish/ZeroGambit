import { ModuleProgress, UserCurriculumProgress } from "@/types/curriculum";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const curriculumApi = {
    /**
     * Sync user profile to backend
     */
    async syncUser(user: { id: string; name: string; email: string; country?: string; is_subscribed?: boolean }) {
        if (!user.id) return;
        try {
            await fetch(`${API_BASE}/api/users/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user),
            });
        } catch (error) {
            console.error("Failed to sync user:", error);
        }
    },

    /**
     * Fetch all curriculum progress for a user
     */
    async getUserProgress(userId: string): Promise<UserCurriculumProgress | null> {
        try {
            const res = await fetch(`${API_BASE}/api/curriculum/progress/${userId}`);
            if (res.ok) {
                return await res.json();
            }
        } catch (error) {
            console.error("Failed to fetch progress:", error);
        }
        return null;
    },

    /**
     * Update progress for a specific module
     */
    async updateModuleProgress(userId: string, moduleId: string, data: { xp: number; level: number; streak: number }) {
        try {
            const query = new URLSearchParams({
                xp: data.xp.toString(),
                level: data.level.toString(),
                streak: data.streak.toString(),
            });

            await fetch(`${API_BASE}/api/curriculum/progress/${userId}/${moduleId}?${query.toString()}`, {
                method: "POST",
            });
        } catch (error) {
            console.error("Failed to update module progress:", error);
        }
    }
};
